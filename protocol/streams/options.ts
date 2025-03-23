export type Opt = {
  /**
   * Memory allocated per connection for parsing messages.
   * Cannot 'usefully' exceed 4,294,967,296 (4 gigabytes) due to 4 byte message length header
   *
   * Default: 2_097_152 (2 megabytes)
   */
  maxBodyBytes?: number; // todo: make this user configurable
};

/**
 * Number of bytes used in the header portion of messages to encode its length as an unsigned integer
 *
 * Default: 4
 */
export const HEADER_BYTES = 4;

export const defaultOpt = (): Required<Opt> => ({
  maxBodyBytes: 2_097_152,
});

export const verifyOptions = (opt: Opt | undefined): Required<Opt> => {
  const o = Object.assign(defaultOpt(), opt) as Required<Opt>;
  if (o.maxBodyBytes > 2 ** (8 * HEADER_BYTES)) {
    throw new Error('InvalidBinaryMessageConfig: Body size cannot exceed value encodable in maxHeaderBytes');
  }
  return o;
};
