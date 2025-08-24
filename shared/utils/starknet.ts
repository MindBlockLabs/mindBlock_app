import { Provider, Contract } from "starknet";

export const getContract = (abi: any, address: string, provider: Provider) => {
  return new Contract(abi, address, provider);
};