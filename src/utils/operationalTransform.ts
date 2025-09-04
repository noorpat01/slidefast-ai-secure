// Operational Transformation (OT) implementation for real-time collaborative editing
// This ensures conflict-free simultaneous editing by multiple users

export interface Operation {
  id: string;
  type: 'insert' | 'delete' | 'retain' | 'replace';
  position: number;
  content?: string;
  length?: number;
  userId: string;
  timestamp: number;
  slideId?: string;
  field: 'title' | 'content' | 'speaker_notes' | 'visual_suggestion';
  contentIndex?: number; // For content array operations
}

export interface TextState {
  text: string;
  version: number;
  operations: Operation[];
}

export class OperationalTransform {
  // Transform operation against another operation
  static transform(op1: Operation, op2: Operation): [Operation, Operation] {
    // If operations are on different fields or slides, no transformation needed
    if (op1.field !== op2.field || op1.slideId !== op2.slideId || op1.contentIndex !== op2.contentIndex) {
      return [op1, op2];
    }

    const transformedOp1 = { ...op1 };
    const transformedOp2 = { ...op2 };

    // Handle different operation combinations
    if (op1.type === 'insert' && op2.type === 'insert') {
      return this.transformInsertInsert(transformedOp1, transformedOp2);
    }
    
    if (op1.type === 'delete' && op2.type === 'delete') {
      return this.transformDeleteDelete(transformedOp1, transformedOp2);
    }
    
    if (op1.type === 'insert' && op2.type === 'delete') {
      return this.transformInsertDelete(transformedOp1, transformedOp2);
    }
    
    if (op1.type === 'delete' && op2.type === 'insert') {
      const [t2, t1] = this.transformInsertDelete(transformedOp2, transformedOp1);
      return [t1, t2];
    }

    if (op1.type === 'replace' || op2.type === 'replace') {
      return this.transformWithReplace(transformedOp1, transformedOp2);
    }

    return [transformedOp1, transformedOp2];
  }

  private static transformInsertInsert(op1: Operation, op2: Operation): [Operation, Operation] {
    if (op1.position <= op2.position) {
      // op1 comes before op2, adjust op2's position
      op2.position += op1.content?.length || 0;
    } else {
      // op2 comes before op1, adjust op1's position
      op1.position += op2.content?.length || 0;
    }
    return [op1, op2];
  }

  private static transformDeleteDelete(op1: Operation, op2: Operation): [Operation, Operation] {
    const end1 = op1.position + (op1.length || 0);
    const end2 = op2.position + (op2.length || 0);

    if (end1 <= op2.position) {
      // op1 is completely before op2
      op2.position -= op1.length || 0;
    } else if (end2 <= op1.position) {
      // op2 is completely before op1
      op1.position -= op2.length || 0;
    } else {
      // Overlapping deletes - need to handle carefully
      const overlapStart = Math.max(op1.position, op2.position);
      const overlapEnd = Math.min(end1, end2);
      const overlapLength = Math.max(0, overlapEnd - overlapStart);

      if (op1.position < op2.position) {
        op1.length = (op1.length || 0) - overlapLength;
        op2.position = op1.position;
        op2.length = (op2.length || 0) - overlapLength;
      } else {
        op2.length = (op2.length || 0) - overlapLength;
        op1.position = op2.position;
        op1.length = (op1.length || 0) - overlapLength;
      }
    }
    
    return [op1, op2];
  }

  private static transformInsertDelete(insert: Operation, delete_: Operation): [Operation, Operation] {
    if (insert.position <= delete_.position) {
      // Insert comes before delete
      delete_.position += insert.content?.length || 0;
    } else if (insert.position > delete_.position + (delete_.length || 0)) {
      // Insert comes after delete
      insert.position -= delete_.length || 0;
    } else {
      // Insert is within delete range
      // Keep delete position, adjust insert to be at delete position
      insert.position = delete_.position;
    }
    
    return [insert, delete_];
  }

  private static transformWithReplace(op1: Operation, op2: Operation): [Operation, Operation] {
    // Replace operations are treated as atomic - last writer wins for simplicity
    // In a more sophisticated implementation, you might want to merge changes
    if (op1.timestamp > op2.timestamp) {
      // op1 is more recent, discard op2
      return [op1, { ...op2, type: 'retain', content: undefined }];
    } else {
      // op2 is more recent, discard op1
      return [{ ...op1, type: 'retain', content: undefined }, op2];
    }
  }

  // Apply operation to text
  static applyOperation(text: string, operation: Operation): string {
    switch (operation.type) {
      case 'insert':
        return text.slice(0, operation.position) + 
               (operation.content || '') + 
               text.slice(operation.position);
      
      case 'delete':
        return text.slice(0, operation.position) + 
               text.slice(operation.position + (operation.length || 0));
      
      case 'replace':
        const endPos = operation.position + (operation.length || 0);
        return text.slice(0, operation.position) + 
               (operation.content || '') + 
               text.slice(endPos);
      
      case 'retain':
      default:
        return text;
    }
  }

  // Generate operation from text changes
  static generateOperation(
    oldText: string, 
    newText: string, 
    userId: string, 
    slideId: string, 
    field: Operation['field'],
    contentIndex?: number
  ): Operation | null {
    // Simple diff algorithm - could be replaced with more sophisticated diffing
    let i = 0;
    
    // Find first difference
    while (i < Math.min(oldText.length, newText.length) && oldText[i] === newText[i]) {
      i++;
    }
    
    if (i === oldText.length && i === newText.length) {
      return null; // No change
    }
    
    if (i === oldText.length) {
      // Pure insertion
      return {
        id: generateOperationId(),
        type: 'insert',
        position: i,
        content: newText.slice(i),
        userId,
        timestamp: Date.now(),
        slideId,
        field,
        contentIndex
      };
    }
    
    if (i === newText.length) {
      // Pure deletion
      return {
        id: generateOperationId(),
        type: 'delete',
        position: i,
        length: oldText.length - i,
        userId,
        timestamp: Date.now(),
        slideId,
        field,
        contentIndex
      };
    }
    
    // Mixed change - treat as replace for simplicity
    let j = oldText.length - 1;
    let k = newText.length - 1;
    
    // Find last matching characters
    while (j > i && k > i && oldText[j] === newText[k]) {
      j--;
      k--;
    }
    
    return {
      id: generateOperationId(),
      type: 'replace',
      position: i,
      length: j - i + 1,
      content: newText.slice(i, k + 1),
      userId,
      timestamp: Date.now(),
      slideId,
      field,
      contentIndex
    };
  }

  // Transform operation against a series of operations
  static transformAgainstOperations(operation: Operation, operations: Operation[]): Operation {
    let transformedOp = operation;
    
    for (const op of operations) {
      if (op.timestamp <= operation.timestamp && op.userId !== operation.userId) {
        const [, transformed] = this.transform(op, transformedOp);
        transformedOp = transformed;
      }
    }
    
    return transformedOp;
  }
}

// Utility functions
function generateOperationId(): string {
  return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export { generateOperationId };
