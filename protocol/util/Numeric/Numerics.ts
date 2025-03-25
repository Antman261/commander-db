import { Numeric } from './NumericBase.ts';

export class UTinyInt extends Numeric<'UTinyInt'> {
  constructor(num: number, buffer?: ArrayBuffer, offset: number = 0) {
    super(num, 'UTinyInt', buffer, offset);
  }
}
export class STinyInt extends Numeric<'STinyInt'> {
  constructor(num: number, buffer?: ArrayBuffer, offset: number = 0) {
    super(num, 'STinyInt', buffer, offset);
  }
}
export class USmallInt extends Numeric<'USmallInt'> {
  constructor(num: number, buffer?: ArrayBuffer, offset: number = 0) {
    super(num, 'USmallInt', buffer, offset);
  }
}
export class SSmallInt extends Numeric<'SSmallInt'> {
  constructor(num: number, buffer?: ArrayBuffer, offset: number = 0) {
    super(num, 'SSmallInt', buffer, offset);
  }
}
export class UInt extends Numeric<'UInt'> {
  constructor(num: number, buffer?: ArrayBuffer, offset: number = 0) {
    super(num, 'UInt', buffer, offset);
  }
  /**
   * Number of bytes to store the numeric
   */
  static bytes = 4;
}

export class SInt extends Numeric<'SInt'> {
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
