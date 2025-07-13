import { Numeric } from './NumericBase.ts';

export class UInt8 extends Numeric<'UTinyInt'> {
  constructor(num: number, buffer?: ArrayBuffer, offset: number = 0) {
    super(num, 'UTinyInt', buffer, offset);
  }
}
export class SInt8 extends Numeric<'STinyInt'> {
  constructor(num: number, buffer?: ArrayBuffer, offset: number = 0) {
    super(num, 'STinyInt', buffer, offset);
  }
}
export class UInt16 extends Numeric<'USmallInt'> {
  constructor(num: number, buffer?: ArrayBuffer, offset: number = 0) {
    super(num, 'USmallInt', buffer, offset);
  }
}
export class SInt16 extends Numeric<'SSmallInt'> {
  constructor(num: number, buffer?: ArrayBuffer, offset: number = 0) {
    super(num, 'SSmallInt', buffer, offset);
  }
}
export class UInt32 extends Numeric<'UInt'> {
  constructor(num: number, buffer?: ArrayBuffer, offset: number = 0) {
    super(num, 'UInt', buffer, offset);
  }
  /**
   * Number of bytes to store the numeric
   */
  static bytes = 4;
}

export class SInt32 extends Numeric<'SInt'> {
  constructor(num: number, buffer?: ArrayBuffer, offset: number = 0) {
    super(num, 'SInt', buffer, offset);
  }
}
// export class UBigInt extends Numeric<'UBigInt'> {
//   constructor(num: number, buffer?: ArrayBuffer, offset: number = 0) {
//     super(num, 'UBigInt', buffer, offset);
//   }
// }

// export class SBigInt extends Numeric<'SBigInt'> {
//   constructor(num: number, buffer?: ArrayBuffer, offset: number = 0) {
//     super(num, 'SBigInt', buffer, offset);
//   }
// }
