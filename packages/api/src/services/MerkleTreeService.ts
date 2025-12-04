import { MerkleProof, MerkleTreeError } from '@zk-census/types';
import { IPFSService } from '@zk-census/ipfs';
import { logger } from '../config/logger';
import { createHash } from 'crypto';

export class MerkleTreeService {
  private ipfsService: IPFSService;
  private trees: Map<string, MerkleTree>;

  constructor() {
    this.ipfsService = new IPFSService();
    this.trees = new Map();
  }

  async addNullifier(censusId: string, nullifier: string): Promise<string> {
    try {
      let tree = this.trees.get(censusId);

      if (!tree) {
        tree = new MerkleTree();
        this.trees.set(censusId, tree);
      }

      tree.insert(nullifier);
      const root = tree.getRoot();

      logger.info(`Added nullifier to Merkle tree for census: ${censusId}`);

      // Persist to IPFS every 100 insertions
      if (tree.size() % 100 === 0) {
        await this.persistToIPFS(censusId, tree);
      }

      return root;
    } catch (error) {
      logger.error('Error adding nullifier to Merkle tree:', error);
      throw new MerkleTreeError('Failed to add nullifier');
    }
  }

  async getProof(censusId: string, nullifier: string): Promise<MerkleProof> {
    try {
      const tree = this.trees.get(censusId);

      if (!tree) {
        throw new MerkleTreeError('Merkle tree not found');
      }

      return tree.getProof(nullifier);
    } catch (error) {
      logger.error('Error getting Merkle proof:', error);
      throw error;
    }
  }

  private async persistToIPFS(censusId: string, tree: MerkleTree): Promise<string> {
    try {
      const treeData = tree.serialize();
      const ipfsHash = await this.ipfsService.add(JSON.stringify(treeData));

      logger.info(`Persisted Merkle tree to IPFS: ${ipfsHash}`);

      return ipfsHash;
    } catch (error) {
      logger.error('Error persisting Merkle tree to IPFS:', error);
      throw error;
    }
  }
}

/**
 * Simple Merkle tree implementation
 */
class MerkleTree {
  private leaves: string[];
  private nodes: Map<number, Map<number, string>>;

  constructor() {
    this.leaves = [];
    this.nodes = new Map();
  }

  insert(leaf: string): void {
    this.leaves.push(this.hash(leaf));
    this.rebuild();
  }

  getRoot(): string {
    if (this.leaves.length === 0) {
      return this.hash('');
    }

    const height = Math.ceil(Math.log2(this.leaves.length));
    const levelNodes = this.nodes.get(height);

    return levelNodes?.get(0) || this.hash('');
  }

  getProof(leaf: string): MerkleProof {
    const hashedLeaf = this.hash(leaf);
    const index = this.leaves.indexOf(hashedLeaf);

    if (index === -1) {
      throw new MerkleTreeError('Leaf not found in tree');
    }

    const siblings: string[] = [];
    const pathIndices: number[] = [];

    let currentIndex = index;
    let currentLevel = 0;

    while (currentLevel < Math.ceil(Math.log2(this.leaves.length))) {
      const siblingIndex = currentIndex % 2 === 0 ? currentIndex + 1 : currentIndex - 1;
      const levelNodes = this.nodes.get(currentLevel);

      if (levelNodes) {
        const sibling = levelNodes.get(siblingIndex) || this.hash('');
        siblings.push(sibling);
        pathIndices.push(currentIndex % 2);
      }

      currentIndex = Math.floor(currentIndex / 2);
      currentLevel++;
    }

    return {
      leaf: hashedLeaf,
      siblings,
      pathIndices,
      root: this.getRoot(),
    };
  }

  size(): number {
    return this.leaves.length;
  }

  serialize(): object {
    return {
      leaves: this.leaves,
      root: this.getRoot(),
    };
  }

  private rebuild(): void {
    this.nodes.clear();

    if (this.leaves.length === 0) return;

    // Level 0: leaves
    const level0 = new Map<number, string>();
    this.leaves.forEach((leaf, i) => level0.set(i, leaf));
    this.nodes.set(0, level0);

    // Build upper levels
    let currentLevel = this.leaves;
    let levelIndex = 1;

    while (currentLevel.length > 1) {
      const nextLevel: string[] = [];
      const levelMap = new Map<number, string>();

      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left;
        const parent = this.hash(left + right);
        nextLevel.push(parent);
        levelMap.set(Math.floor(i / 2), parent);
      }

      this.nodes.set(levelIndex, levelMap);
      currentLevel = nextLevel;
      levelIndex++;
    }
  }

  private hash(data: string): string {
    return createHash('sha256').update(data).digest('hex');
  }
}
