declare module 'pg' {
  export class Client {
    constructor(config?: any);
    connect(): Promise<void>;
    query(queryText: string, values?: any[]): Promise<any>;
    end(): Promise<void>;
  }
  export class Pool {
    constructor(config?: any);
    connect(): Promise<any>;
    query(queryText: string, values?: any[]): Promise<any>;
    end(): Promise<void>;
  }
}
