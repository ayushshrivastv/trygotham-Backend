import { create, IPFSHTTPClient } from 'ipfs-http-client';
import { IPFSError } from '@zk-census/types';

export class IPFSService {
  private client: IPFSHTTPClient;
  private url: string;

  constructor(url?: string) {
    this.url = url || process.env.IPFS_URL || 'http://localhost:5001';

    try {
      this.client = create({ url: this.url });
    } catch (error) {
      throw new IPFSError(`Failed to connect to IPFS at ${this.url}`);
    }
  }

  /**
   * Add data to IPFS
   */
  async add(data: string | Buffer): Promise<string> {
    try {
      const content = typeof data === 'string' ? Buffer.from(data) : data;

      const result = await this.client.add(content);
      return result.cid.toString();
    } catch (error) {
      throw new IPFSError(`Failed to add data to IPFS: ${error}`);
    }
  }

  /**
   * Add JSON object to IPFS
   */
  async addJSON(obj: object): Promise<string> {
    try {
      const json = JSON.stringify(obj);
      return await this.add(json);
    } catch (error) {
      throw new IPFSError(`Failed to add JSON to IPFS: ${error}`);
    }
  }

  /**
   * Get data from IPFS
   */
  async get(cid: string): Promise<string> {
    try {
      const chunks = [];

      for await (const chunk of this.client.cat(cid)) {
        chunks.push(chunk);
      }

      const data = Buffer.concat(chunks.map(chunk => Buffer.from(chunk)));
      return data.toString('utf-8');
    } catch (error) {
      throw new IPFSError(`Failed to get data from IPFS: ${error}`);
    }
  }

  /**
   * Get JSON object from IPFS
   */
  async getJSON<T = any>(cid: string): Promise<T> {
    try {
      const data = await this.get(cid);
      return JSON.parse(data);
    } catch (error) {
      throw new IPFSError(`Failed to get JSON from IPFS: ${error}`);
    }
  }

  /**
   * Pin data to IPFS
   */
  async pin(cid: string): Promise<void> {
    try {
      await this.client.pin.add(cid);
    } catch (error) {
      throw new IPFSError(`Failed to pin data to IPFS: ${error}`);
    }
  }

  /**
   * Unpin data from IPFS
   */
  async unpin(cid: string): Promise<void> {
    try {
      await this.client.pin.rm(cid);
    } catch (error) {
      throw new IPFSError(`Failed to unpin data from IPFS: ${error}`);
    }
  }

  /**
   * Check if IPFS daemon is running
   */
  async isOnline(): Promise<boolean> {
    try {
      const id = await this.client.id();
      return !!id;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get IPFS node ID
   */
  async getNodeId(): Promise<string> {
    try {
      const id = await this.client.id();
      return id.id.toString();
    } catch (error) {
      throw new IPFSError(`Failed to get IPFS node ID: ${error}`);
    }
  }

  /**
   * Get gateway URL for a CID
   */
  getGatewayUrl(cid: string, gateway?: string): string {
    const baseGateway = gateway || process.env.IPFS_GATEWAY || 'https://ipfs.io';
    return `${baseGateway}/ipfs/${cid}`;
  }
}

export default IPFSService;
