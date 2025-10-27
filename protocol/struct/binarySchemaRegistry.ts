import z from '@zod/zod';

export type RegistryEntry = { id: string; byteLength: number };

export const binaryRegistry = z.registry<RegistryEntry>();
