/**
 * Service template for business logic separation
 * Why: Keeps business logic testable and separate from VSCode APIs
 */
export class ServiceTemplate {
    private readonly dependency: DependencyInterface;

    constructor(dependency: DependencyInterface) {
        this.dependency = dependency;
    }

    /**
     * Main business method with clear responsibility
     * What: Performs specific business operation
     * @param input - Input data for the operation
     * @returns Promise with operation result
     * @throws ServiceError when operation fails
     */
    async performOperation(input: OperationInput): Promise<OperationResult> {
        // Validate input
        this.validateInput(input);

        try {
            // Business logic here - no side effects
            const processedData = this.processData(input);
            
            // Use dependency for side effects
            return await this.dependency.executeOperation(processedData);
        } catch (error) {
            throw new ServiceError(`Operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Private helper method for business logic
     */
    private processData(input: OperationInput): ProcessedData {
        // Pure business logic - easily testable
        return {
            // transformation logic
        };
    }

    /**
     * Input validation - separate method for clarity
     */
    private validateInput(input: OperationInput): void {
        if (!input) {
            throw new ServiceError('Input is required');
        }
        // Additional validation logic
    }
}

// Types for the template
export interface OperationInput {
    // Define input structure
}

export interface OperationResult {
    success: boolean;
    data?: any;
    error?: string;
}

export interface ProcessedData {
    // Define processed data structure
}

export interface DependencyInterface {
    executeOperation(data: ProcessedData): Promise<OperationResult>;
}

export class ServiceError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ServiceError';
    }
} 