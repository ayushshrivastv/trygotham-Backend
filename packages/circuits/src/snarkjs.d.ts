declare module 'snarkjs' {
  export const groth16: {
    fullProve(
      input: any,
      wasmPath: string,
      zkeyPath: string
    ): Promise<{ proof: any; publicSignals: any[] }>;
    verify(verificationKey: any, publicSignals: any[], proof: any): Promise<boolean>;
    exportVerificationKey(zkeyPath: string): Promise<any>;
  };
}
