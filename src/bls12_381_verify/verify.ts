import { log } from 'matchstick-as';
import { BigInt as BI, Bytes } from '../../node_modules/@graphprotocol/graph-ts';
import { Sha256 } from './sha256';

class Curve {
  P: BI;
  r: BI;
  h: BI;
  Gx: BI;
  Gy: BI;
  b: BI;
  P2: BI;
  h2: BI;
  G2x: BI[];
  G2y: BI[];
  b2: BI[];
  x: BI;
  h2Eff: BI;
}

class Htf {
  DST: string;
  p: BI;
  m: i32;
  k: f64;
  expand: boolean;
  hash: Hash;
}

class Reim {
  re: BI;
  im: BI;
}

class Fp4SquareResult {
  first: Fp2;
  second: Fp2;
}

class SqrtResult {
  success: boolean;
  sqrtCandidateOrGamma: Fp2;
}

type Hash = (msg: Uint8Array) => Uint8Array;
type Fp2_4 = Array<Fp2>;

const CURVE: Curve = {
  P: biFromHex('0x1a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaaab'),
  r: biFromHex('0x73eda753299d7d483339d80809a1d80553bda402fffe5bfeffffffff00000001'),
  h: biFromHex('0x396c8c005555e1568c00aaab0000aaab'),
  Gx: biFromHex('0x17f1d3a73197d7942695638c4fa9ac0fc3688c4f9774b905a14e3a3f171bac586c55e83ff97a1aeffb3af00adb22c6bb'),
  Gy: biFromHex('0x08b3f481e3aaa0f1a09e30ed741d8ae4fcf5e095d5d00af600db18cb2c04b3edd03cc744a2888ae40caa232946c5e7e1'),
  b: biFromHex('0x04'),
  P2: biFromHex('0x1a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaaab')
    .pow(2)
    .minus(BI.fromI32(1)),
  h2: biFromHex(
    '0x05d543a95414e7f1091d50792876a202cd91de4547085abaa68a205b2e5a7ddfa628f1cb4d9e82ef21537e293a6691ae1616ec6e786f0c70cf1c38e31c7238e5'
  ),
  G2x: [
    biFromHex('0x024aa2b2f08f0a91260805272dc51051c6e47ad4fa403b02b4510b647ae3d1770bac0326a805bbefd48056c8c121bdb8'),
    biFromHex('0x13e02b6052719f607dacd3a088274f65596bd0d09920b61ab5da61bbdc7f5049334cf11213945d57e5ac7d055d042b7e')
  ],
  G2y: [
    biFromHex('0x0ce5d527727d6e118cc9cdc6da2e351aadfd9baa8cbdd3a76d429a695160d12c923ac9cc3baca289e193548608b82801'),
    biFromHex('0x0606c4a02ea734cc32acd2b02bc28b99cb3e287e85a763af267492ab572e99ab3f370d275cec1da1aaa9075ff05f79be')
  ],
  b2: [biFromHex('0x04'), biFromHex('0x04')],
  x: biFromHex('0xd201000000010000'),
  h2Eff: biFromHex(
    '0x0bc69f08f2ee75b3584c6a0ea91b352888e2a8e9145ad7689986ff031508ffe1329c2f178731db956d82bf015d1212b02ec0ec69d7477c1ae954cbc06689f6a359894c0adebbf6b4e8020005aaa95551'
  )
};

const sha256 = (msg: Uint8Array): Uint8Array => {
  const st = new Sha256();
  for (let i = 0; i < msg.length; i += 64) {
    st.update(msg.slice(i, i + 64));
  }
  return st.final();
};

const htfDefaults: Htf = {
  // DST: a domain separation tag
  // defined in section 2.2.5
  // Use utils.getDSTLabel(), utils.setDSTLabel(value)
  DST: 'BLS_SIG_BLS12381G2_XMD:SHA-256_SSWU_RO_POP_',
  // p: the characteristic of F
  //    where F is a finite field of characteristic p and order q = p^m
  p: CURVE.P,
  // m: the extension degree of F, m >= 1
  //     where F is a finite field of characteristic p and order q = p^m
  m: 2,
  // k: the target security level for the suite in bits
  // defined in section 5.1
  k: 128,
  // option to use a message that has already been processed by
  // expand_message_xmd
  expand: true,
  // Hash functions for: expand_message_xmd is appropriate for use with a
  // wide range of hash functions, including SHA-2, SHA-3, BLAKE2, and others.
  // BBS+ uses blake2: https://github.com/hyperledger/aries-framework-go/issues/2247
  hash: sha256
};

class Fp {
  static readonly ORDER: BI = CURVE.P;
  static readonly ZERO: Fp = new Fp(BI.zero());
  static readonly ONE: Fp = new Fp(BI.fromI32(1));

  readonly value: BI;

  constructor(value: BI) {
    this.value = mod(value, Fp.ORDER);
  }

  log(name: string, depth: i32): void {
    log.info(genZeroes(depth) + 'fp ' + name, []);
    log.info(genZeroes(depth + 2) + 'value: ' + this.value.toString(), []);
  }

  pow(n: BI): Fp {
    return new Fp(powMod(this.value, n, Fp.ORDER));
  }

  plus(rhs: Fp): Fp {
    return new Fp(this.value.plus(rhs.value));
  }

  sqrt(): Fp | null {
    const root = this.pow(Fp.ORDER.plus(BI.fromI32(1)).div(BI.fromI32(4)));
    if (!root.square().equals(this)) return null;
    return root;
  }

  square(): Fp {
    return new Fp(this.value.times(this.value));
  }

  equals(rhs: Fp): boolean {
    return this.value.equals(rhs.value);
  }

  negate(): Fp {
    return new Fp(this.value.times(BI_neg_one));
  }

  isZero(): boolean {
    return this.value.equals(BI.zero());
  }

  multiply(rhs: Fp): Fp {
    return new Fp(this.value.times(rhs.value));
  }

  multiplyBI(rhs: BI): Fp {
    return new Fp(this.value.times(rhs));
  }

  subtract(rhs: Fp): Fp {
    return new Fp(this.value.minus(rhs.value));
  }

  invert(): Fp {
    return new Fp(invert(this.value, Fp.ORDER));
  }

  add(rhs: Fp): Fp {
    return new Fp(this.value.plus(rhs.value));
  }
}

class Fp2 {
  static readonly ORDER: BI = CURVE.P2;
  static readonly MAX_BITS: i32 = bitLen(CURVE.P);
  static readonly BYTES_LEN: i32 = i32(Math.ceil(Fp2.MAX_BITS / 8));
  static readonly ZERO: Fp2 = new Fp2(Fp.ZERO, Fp.ZERO);
  static readonly ONE: Fp2 = new Fp2(Fp.ONE, Fp.ZERO);

  constructor(readonly c0: Fp, readonly c1: Fp) {
    if (typeof c0 === 'bigint') throw new Error('c0: Expected Fp');
    if (typeof c1 === 'bigint') throw new Error('c1: Expected Fp');
  }
  mulByNonresidue(): Fp2 {
    const c0 = this.c0;
    const c1 = this.c1;
    return new Fp2(c0.subtract(c1), c0.plus(c1));
  }
  isZero(): boolean {
    return this.c0.isZero() && this.c1.isZero();
  }
  static fromBigTuple(tuple: BI[]): Fp2 {
    return new Fp2(new Fp(tuple[0]), new Fp(tuple[1]));
  }
  pow(n: BI): Fp2 {
    return powMod_FQP(this, Fp2.ONE, n);
  }

  log(name: string, depth: i32): void {
    log.info(genZeroes(depth) + 'fp2 ' + name, []);
    this.c0.log(name, depth + 2);
    this.c1.log(name, depth + 2);
  }

  multiply(rhs: Fp2): Fp2 {
    const c0 = this.c0;
    const c1 = this.c1;
    const r0 = rhs.c0;
    const r1 = rhs.c1;
    // (a+bi)(c+di) = (ac−bd) + (ad+bc)i
    let t1 = c0.multiply(r0); // c0 * o0
    let t2 = c1.multiply(r1); // c1 * o1
    // (T1 - T2) + ((c0 + c1) * (r0 + r1) - (T1 + T2))*i
    return new Fp2(t1.subtract(t2), c0.plus(c1).multiply(r0.plus(r1)).subtract(t1.plus(t2)));
  }

  multiplyBI(rhs: BI): Fp2 {
    const c0 = this.c0;
    const c1 = this.c1;
    return new Fp2(c0.multiplyBI(rhs), c1.multiplyBI(rhs));
  }

  square(): Fp2 {
    const c0 = this.c0;
    const c1 = this.c1;
    const a = c0.plus(c1);
    const b = c0.subtract(c1);
    const c = c0.plus(c0);
    return new Fp2(a.multiply(b), c.multiply(c1));
  }

  add(rhs: Fp2): Fp2 {
    const c0 = this.c0;
    const c1 = this.c1;
    const r0 = rhs.c0;
    const r1 = rhs.c1;
    return new Fp2(c0.plus(r0), c1.plus(r1));
  }

  negate(): Fp2 {
    const c0 = this.c0;
    const c1 = this.c1;
    return new Fp2(c0.negate(), c1.negate());
  }

  subtract(rhs: Fp2): Fp2 {
    const c0 = this.c0;
    const c1 = this.c1;
    const r0 = rhs.c0;
    const r1 = rhs.c1;
    return new Fp2(c0.subtract(r0), c1.subtract(r1));
  }

  sqrt(): Fp2 | null {
    // TODO: Optimize this line. It's extremely slow.
    // Speeding this up would boost aggregateSignatures.
    // https://eprint.iacr.org/2012/685.pdf applicable?
    // https://github.com/zkcrypto/bls12_381/blob/080eaa74ec0e394377caa1ba302c8c121df08b07/src/fp2.rs#L250
    // https://github.com/supranational/blst/blob/aae0c7d70b799ac269ff5edf29d8191dbd357876/src/exp2.c#L1
    // Inspired by https://github.com/dalek-cryptography/curve25519-dalek/blob/17698df9d4c834204f83a3574143abacb4fc81a5/src/field.rs#L99
    const candidateSqrt = this.pow(Fp2.ORDER.plus(BI.fromI32(8)).div(BI.fromI32(16)));
    const check = candidateSqrt.square().div(this);
    const R = FP2_ROOTS_OF_UNITY;
    // const divisor = [R[0], R[2], R[4], R[6]].find((r) => r.equals(check));
    let divisor: Fp2;
    let index: i32;
    if (check.equals(R[0])) {
      divisor = R[0];
      index = 0;
    } else if (check.equals(R[2])) {
      divisor = R[2];
      index = 2;
    } else if (check.equals(R[4])) {
      divisor = R[4];
      index = 4;
    } else if (check.equals(R[6])) {
      divisor = R[6];
      index = 6;
    } else {
      return null;
    }
    const root = R[index / 2];
    if (!root) throw new Error('Invalid root');
    const x1 = candidateSqrt.div(root);
    const x2 = x1.negate();
    const reim1 = x1.reim();
    const re1 = reim1.re;
    const im1 = reim1.im;
    const reim2 = x2.reim();
    const re2 = reim2.re;
    const im2 = reim2.im;
    if (im1.gt(im2) || (im1.equals(im2) && re1.gt(re2))) return x1;
    return x2;
  }
  reim(): Reim {
    return { re: this.c0.value, im: this.c1.value };
  }

  invert(): Fp2 {
    const reim = this.reim();

    const a = reim.re;
    const b = reim.im;
    const factor = new Fp(a.times(a).plus(b.times(b))).invert();
    return new Fp2(factor.multiply(new Fp(a)), factor.multiply(new Fp(b.times(BI_neg_one))));
  }

  div(rhs: Fp2): Fp2 {
    const inv = rhs.invert();
    return this.multiply(inv);
  }

  divBI(rhs: BI): Fp2 {
    const inv = new Fp(rhs).invert().value;
    return this.multiplyBI(inv);
  }

  equals(rhs: Fp2): boolean {
    const c0 = this.c0;
    const c1 = this.c1;
    const r0 = rhs.c0;
    const r1 = rhs.c1;
    return c0.equals(r0) && c1.equals(r1);
  }

  // Raises to q**i -th power
  frobeniusMap(power: i32): Fp2 {
    return new Fp2(this.c0, this.c1.multiply(FP2_FROBENIUS_COEFFICIENTS[power % 2]));
  }

  multiplyByB(): Fp2 {
    let c0 = this.c0;
    let c1 = this.c1;
    let t0 = c0.multiplyBI(BI.fromI32(4)); // 4 * c0
    let t1 = c1.multiplyBI(BI.fromI32(4)); // 4 * c1
    // (T0-T1) + (T0+T1)*i
    return new Fp2(t0.subtract(t1), t0.add(t1));
  }
}

class Fp6 {
  static readonly ZERO: Fp6 = new Fp6(Fp2.ZERO, Fp2.ZERO, Fp2.ZERO);
  static readonly ONE: Fp6 = new Fp6(Fp2.ONE, Fp2.ZERO, Fp2.ZERO);
  static readonly BYTES_LEN: i32 = 3 * Fp2.BYTES_LEN;
  constructor(readonly c0: Fp2, readonly c1: Fp2, readonly c2: Fp2) {}
  multiply(rhs: Fp6): Fp6 {
    const c0 = this.c0;
    const c1 = this.c1;
    const c2 = this.c2;
    const r0 = rhs.c0;
    const r1 = rhs.c1;
    const r2 = rhs.c2;
    let t0 = c0.multiply(r0); // c0 * o0
    let t1 = c1.multiply(r1); // c1 * o1
    let t2 = c2.multiply(r2); // c2 * o2
    return new Fp6(
      // t0 + (c1 + c2) * (r1 * r2) - (T1 + T2) * (u + 1)
      t0.add(c1.add(c2).multiply(r1.add(r2)).subtract(t1.add(t2)).mulByNonresidue()),
      // (c0 + c1) * (r0 + r1) - (T0 + T1) + T2 * (u + 1)
      c0.add(c1).multiply(r0.add(r1)).subtract(t0.add(t1)).add(t2.mulByNonresidue()),
      // T1 + (c0 + c2) * (r0 + r2) - T0 + T2
      t1.add(c0.add(c2).multiply(r0.add(r2)).subtract(t0.add(t2)))
    );
  }
  multiplyBI(rhs: BI): Fp6 {
    return new Fp6(this.c0.multiplyBI(rhs), this.c1.multiplyBI(rhs), this.c2.multiplyBI(rhs));
  }

  log(name: string, depth: i32): void {
    log.info(genZeroes(depth) + 'fp6 ' + name, []);
    this.c0.log(name, depth + 2);
    this.c1.log(name, depth + 2);
    this.c2.log(name, depth + 2);
  }

  plus(rhs: Fp6): Fp6 {
    const c0 = this.c0;
    const c1 = this.c1;
    const c2 = this.c2;
    const r0 = rhs.c0;
    const r1 = rhs.c1;
    const r2 = rhs.c2;
    return new Fp6(c0.add(r0), c1.add(r1), c2.add(r2));
  }

  subtract(rhs: Fp6): Fp6 {
    const c0 = this.c0;
    const c1 = this.c1;
    const c2 = this.c2;
    const r0 = rhs.c0;
    const r1 = rhs.c1;
    const r2 = rhs.c2;
    return new Fp6(c0.subtract(r0), c1.subtract(r1), c2.subtract(r2));
  }

  equals(rhs: Fp6): boolean {
    const c0 = this.c0;
    const c1 = this.c1;
    const c2 = this.c2;
    const r0 = rhs.c0;
    const r1 = rhs.c1;
    const r2 = rhs.c2;
    return c0.equals(r0) && c1.equals(r1) && c2.equals(r2);
  }

  mulByNonresidue(): Fp6 {
    return new Fp6(this.c2.mulByNonresidue(), this.c0, this.c1);
  }

  isZero(): boolean {
    return this.c0.isZero() && this.c1.isZero() && this.c2.isZero();
  }

  square(): Fp6 {
    const c0 = this.c0;
    const c1 = this.c1;
    const c2 = this.c2;
    let t0 = c0.square(); // c0²
    let t1 = c0.multiply(c1).multiplyBI(BI.fromI32(2)); // 2 * c0 * c1
    let t3 = c1.multiply(c2).multiplyBI(BI.fromI32(2)); // 2 * c1 * c2
    let t4 = c2.square(); // c2²
    return new Fp6(
      t3.mulByNonresidue().add(t0), // T3 * (u + 1) + T0
      t4.mulByNonresidue().add(t1), // T4 * (u + 1) + T1
      // T1 + (c0 - c1 + c2)² + T3 - T0 - T4
      t1.add(c0.subtract(c1).add(c2).square()).add(t3).subtract(t0).subtract(t4)
    );
  }

  invert(): Fp6 {
    const c0 = this.c0;
    const c1 = this.c1;
    const c2 = this.c2;
    let t0 = c0.square().subtract(c2.multiply(c1).mulByNonresidue()); // c0² - c2 * c1 * (u + 1)
    let t1 = c2.square().mulByNonresidue().subtract(c0.multiply(c1)); // c2² * (u + 1) - c0 * c1
    let t2 = c1.square().subtract(c0.multiply(c2)); // c1² - c0 * c2
    // 1/(((c2 * T1 + c1 * T2) * v) + c0 * T0)
    let t4 = c2.multiply(t1).add(c1.multiply(t2)).mulByNonresidue().add(c0.multiply(t0)).invert();
    return new Fp6(t4.multiply(t0), t4.multiply(t1), t4.multiply(t2));
  }

  negate(): Fp6 {
    const c0 = this.c0;
    const c1 = this.c1;
    const c2 = this.c2;
    return new Fp6(c0.negate(), c1.negate(), c2.negate());
  }

  multiplyByFp2(rhs: Fp2): Fp6 {
    const c0 = this.c0;
    const c1 = this.c1;
    const c2 = this.c2;
    return new Fp6(c0.multiply(rhs), c1.multiply(rhs), c2.multiply(rhs));
  }

  frobeniusMap(power: i32): Fp6 {
    return new Fp6(
      this.c0.frobeniusMap(power),
      this.c1.frobeniusMap(power).multiply(FP6_FROBENIUS_COEFFICIENTS_1[power % 6]),
      this.c2.frobeniusMap(power).multiply(FP6_FROBENIUS_COEFFICIENTS_2[power % 6])
    );
  }

  multiplyBy1(b1: Fp2): Fp6 {
    return new Fp6(this.c2.multiply(b1).mulByNonresidue(), this.c0.multiply(b1), this.c1.multiply(b1));
  }
  // Sparse multiplication
  multiplyBy01(b0: Fp2, b1: Fp2): Fp6 {
    const c0 = this.c0;
    const c1 = this.c1;
    const c2 = this.c2;
    let t0 = c0.multiply(b0); // c0 * b0
    let t1 = c1.multiply(b1); // c1 * b1
    return new Fp6(
      // ((c1 + c2) * b1 - T1) * (u + 1) + T0
      c1.add(c2).multiply(b1).subtract(t1).mulByNonresidue().add(t0),
      // (b0 + b1) * (c0 + c1) - T0 - T1
      b0.add(b1).multiply(c0.add(c1)).subtract(t0).subtract(t1),
      // (c0 + c2) * b0 - T0 + T1
      c0.add(c2).multiply(b0).subtract(t0).add(t1)
    );
  }

  add(rhs: Fp6): Fp6 {
    const c0 = this.c0;
    const c1 = this.c1;
    const c2 = this.c2;
    const r0 = rhs.c0;
    const r1 = rhs.c1;
    const r2 = rhs.c2;
    return new Fp6(c0.add(r0), c1.add(r1), c2.add(r2));
  }
}

class Fp12 {
  static readonly ZERO: Fp12 = new Fp12(Fp6.ZERO, Fp6.ZERO);
  static readonly ONE: Fp12 = new Fp12(Fp6.ONE, Fp6.ZERO);
  static readonly BYTES_LEN: i32 = 2 * Fp6.BYTES_LEN;

  constructor(readonly c0: Fp6, readonly c1: Fp6) {}

  multiply(other: Fp12): Fp12 {
    const c0 = this.c0;
    const c1 = this.c1;
    const r0 = other.c0;
    const r1 = other.c1;
    const t1 = c0.multiply(r0);
    const t2 = c1.multiply(r1);
    return new Fp12(t1.plus(t2.mulByNonresidue()), c0.plus(c1).multiply(r0.plus(r1)).subtract(t1.plus(t2)));
  }

  log(name: string, depth: i32): void {
    log.info(genZeroes(depth) + 'fp12 ' + name, []);
    this.c0.log(name, depth + 2);
    this.c0.log(name, depth + 2);
  }

  multiplyBI(rhs: BI): Fp12 {
    return new Fp12(this.c0.multiplyBI(rhs), this.c1.multiplyBI(rhs));
  }

  private Fp4Square(a: Fp2, b: Fp2): Fp4SquareResult {
    const a2 = a.square();
    const b2 = b.square();
    return {
      first: b2.mulByNonresidue().add(a2), // b² * Nonresidue + a²
      second: a.add(b).square().subtract(a2).subtract(b2) // (a + b)² - a² - b²
    };
  }

  private cyclotomicSquare(): Fp12 {
    const c0c0 = this.c0.c0;
    const c0c1 = this.c0.c1;
    const c0c2 = this.c0.c2;
    const c1c0 = this.c1.c0;
    const c1c1 = this.c1.c1;
    const c1c2 = this.c1.c2;
    const fp4s0 = this.Fp4Square(c0c0, c1c1);
    const fp4s1 = this.Fp4Square(c1c0, c0c2);
    const fp4s2 = this.Fp4Square(c0c1, c1c2);
    const t3 = fp4s0.first;
    const t4 = fp4s0.second;
    const t5 = fp4s1.first;
    const t6 = fp4s1.second;
    const t7 = fp4s2.first;
    const t8 = fp4s2.second;
    let t9 = t8.mulByNonresidue(); // T8 * (u + 1)
    return new Fp12(
      new Fp6(
        t3.subtract(c0c0).multiplyBI(BI.fromI32(2)).add(t3), // 2 * (T3 - c0c0)  + T3
        t5.subtract(c0c1).multiplyBI(BI.fromI32(2)).add(t5), // 2 * (T5 - c0c1)  + T5
        t7.subtract(c0c2).multiplyBI(BI.fromI32(2)).add(t7)
      ), // 2 * (T7 - c0c2)  + T7
      new Fp6(
        t9.add(c1c0).multiplyBI(BI.fromI32(2)).add(t9), // 2 * (T9 + c1c0) + T9
        t4.add(c1c1).multiplyBI(BI.fromI32(2)).add(t4), // 2 * (T4 + c1c1) + T4
        t6.add(c1c2).multiplyBI(BI.fromI32(2)).add(t6)
      )
    ); // 2 * (T6 + c1c2) + T6
  }

  private cyclotomicExp(n: BI): Fp12 {
    let z = Fp12.ONE;
    for (let i = BLS_X_LEN - 1; i >= 0; i--) {
      z = z.cyclotomicSquare();
      if (bitGet(n, u8(i))) z = z.multiply(this);
    }
    return z;
  }

  finalExponentiate(): Fp12 {
    const x = CURVE.x;
    // this^(q⁶) / this
    const t0 = this.frobeniusMap(6).div(this);
    // t0^(q²) * t0
    const t1 = t0.frobeniusMap(2).multiply(t0);
    const t2 = t1.cyclotomicExp(x).conjugate();
    const t3 = t1.cyclotomicSquare().conjugate().multiply(t2);
    const t4 = t3.cyclotomicExp(x).conjugate();
    const t5 = t4.cyclotomicExp(x).conjugate();
    const t6 = t5.cyclotomicExp(x).conjugate().multiply(t2.cyclotomicSquare());
    const t7 = t6.cyclotomicExp(x).conjugate();
    const t2_t5_pow_q2 = t2.multiply(t5).frobeniusMap(2);
    const t4_t1_pow_q3 = t4.multiply(t1).frobeniusMap(3);
    const t6_t1c_pow_q1 = t6.multiply(t1.conjugate()).frobeniusMap(1);
    const t7_t3c_t1 = t7.multiply(t3.conjugate()).multiply(t1);
    // (t2 * t5)^(q²) * (t4 * t1)^(q³) * (t6 * t1.conj)^(q^1) * t7 * t3.conj * t1
    return t2_t5_pow_q2.multiply(t4_t1_pow_q3).multiply(t6_t1c_pow_q1).multiply(t7_t3c_t1);
  }

  div(rhs: Fp12): Fp12 {
    const inv = rhs.invert();
    return this.multiply(inv);
  }

  divBI(rhs: BI): Fp12 {
    const inv = new Fp(rhs).invert().value;
    return this.multiplyBI(inv);
  }

  equals(rhs: Fp12): boolean {
    const c0 = this.c0;
    const c1 = this.c1;
    const r0 = rhs.c0;
    const r1 = rhs.c1;
    return c0.equals(r0) && c1.equals(r1);
  }

  isZero(): boolean {
    return this.c0.isZero() && this.c1.isZero();
  }

  invert(): Fp12 {
    const c0 = this.c0;
    const c1 = this.c1;
    let t = c0.square().subtract(c1.square().mulByNonresidue()).invert(); // 1 / (c0² - c1² * v)
    return new Fp12(c0.multiply(t), c1.multiply(t).negate()); // ((C0 * T) * T) + (-C1 * T) * w
  }

  multiplyByFp2(rhs: Fp2): Fp12 {
    return new Fp12(this.c0.multiplyByFp2(rhs), this.c1.multiplyByFp2(rhs));
  }

  frobeniusMap(power: i32): Fp12 {
    const r0 = this.c0.frobeniusMap(power);
    const c0_c1_c2 = this.c1.frobeniusMap(power);
    const c0 = c0_c1_c2.c0;
    const c1 = c0_c1_c2.c1;
    const c2 = c0_c1_c2.c2;
    const coeff: Fp2 = FP12_FROBENIUS_COEFFICIENTS[power % 12];
    return new Fp12(r0, new Fp6(c0.multiply(coeff), c1.multiply(coeff), c2.multiply(coeff)));
  }

  // Sparse multiplication
  multiplyBy014(o0: Fp2, o1: Fp2, o4: Fp2): Fp12 {
    const c0 = this.c0;
    const c1 = this.c1;
    let t0 = c0.multiplyBy01(o0, o1);
    let t1 = c1.multiplyBy1(o4);
    return new Fp12(
      t1.mulByNonresidue().add(t0), // T1 * v + T0
      // (c1 + c0) * [o0, o1+o4] - T0 - T1
      c1.add(c0).multiplyBy01(o0, o1.add(o4)).subtract(t0).subtract(t1)
    );
  }

  square(): Fp12 {
    const c0 = this.c0;
    const c1 = this.c1;
    let ab = c0.multiply(c1); // c0 * c1
    return new Fp12(
      // (c1 * v + c0) * (c0 + c1) - AB - AB * v
      c1.mulByNonresidue().add(c0).multiply(c0.add(c1)).subtract(ab).subtract(ab.mulByNonresidue()),
      ab.add(ab)
    ); // AB + AB
  }

  conjugate(): Fp12 {
    return new Fp12(this.c0, this.c1.negate());
  }
}

class PointG1 {
  static BASE: PointG1 = new PointG1(new Fp(CURVE.Gx), new Fp(CURVE.Gy), Fp.ONE);
  static ZERO: PointG1 = new PointG1(Fp.ONE, Fp.ONE, Fp.ZERO);

  constructor(public readonly x: Fp, public readonly y: Fp, public readonly z: Fp = Fp.ONE) {}

  static fromHex(bytes: Uint8Array): PointG1 {
    let point: PointG1;
    if (bytes.length == 48) {
      const P = CURVE.P;
      const compressedValue = bytesToNumberBE(bytes);
      const bflag = mod(compressedValue, POW_2_383).div(POW_2_382);
      if (bflag.equals(BI.fromI32(1))) {
        return PointG1.ZERO;
      }
      const x = new Fp(mod(compressedValue, POW_2_381));
      const right = x.pow(BI.fromI32(3)).plus(new Fp(CURVE.b));
      let y = right.sqrt();
      if (!y) {
        throw new Error('Invalid compressed G1 point');
      }
      const aflag = mod(compressedValue, POW_2_382).div(POW_2_381);
      if (!y.value.times(BI.fromI32(2)).div(P).equals(aflag)) {
        y = y.negate();
      }
      point = new PointG1(x, y);
    } else if (bytes.length == 96) {
      throw new Error('TODO');
    } else {
      throw new Error('Invalid point G1, expected 48/96 bytes');
    }
    return point;
  }

  createPoint(x: Fp, y: Fp, z: Fp): PointG1 {
    return new PointG1(x, y, z);
  }

  negate(): PointG1 {
    return this.createPoint(this.x, this.y.negate(), this.z);
  }

  isZero(): boolean {
    return this.z.isZero();
  }

  assertValidity(): PointG1 {
    if (this.isZero()) return this;
    if (!this.isOnCurve()) throw new Error('Invalid G1 point: not on curve Fp');
    if (!this.isTorsionFree()) throw new Error('Invalid G1 point: must be of prime-order subgroup');
    return this;
  }

  // [-0xd201000000010000]P

  getZero(): PointG1 {
    return this.createPoint(Fp.ONE, Fp.ONE, Fp.ZERO);
  }

  private validateScalar(n: BI): BI {
    if (n.le(BI.zero()) || n.gt(CURVE.r)) {
      throw new Error(`Point#multiply: invalid scalar, expected positive integer < CURVE.r. Got: ${n}`);
    }
    return n;
  }

  double(): PointG1 {
    const x = this.x;
    const y = this.y;
    const z = this.z;
    const W = x.multiply(x).multiplyBI(BI.fromI32(3));
    const S = y.multiply(z);
    const SS = S.multiply(S);
    const SSS = SS.multiply(S);
    const B = x.multiply(y).multiply(S);
    const H = W.multiply(W).subtract(B.multiplyBI(BI.fromI32(8)));
    const X3 = H.multiply(S).multiplyBI(BI.fromI32(2));
    // W * (4 * B - H) - 8 * y * y * S_squared
    const Y3 = W.multiply(B.multiplyBI(BI.fromI32(4)).subtract(H)).subtract(
      y.multiply(y).multiplyBI(BI.fromI32(8)).multiply(SS)
    );
    const Z3 = SSS.multiplyBI(BI.fromI32(8));
    return this.createPoint(X3, Y3, Z3);
  }

  add(rhs: PointG1): PointG1 {
    const p1 = this;
    const p2 = rhs;
    if (p1.isZero()) return p2;
    if (p2.isZero()) return p1;
    const X1 = p1.x;
    const Y1 = p1.y;
    const Z1 = p1.z;
    const X2 = p2.x;
    const Y2 = p2.y;
    const Z2 = p2.z;
    const U1 = Y2.multiply(Z1);
    const U2 = Y1.multiply(Z2);
    const V1 = X2.multiply(Z1);
    const V2 = X1.multiply(Z2);
    if (V1.equals(V2) && U1.equals(U2)) return this.double();
    if (V1.equals(V2)) return this.getZero();
    const U = U1.subtract(U2);
    const V = V1.subtract(V2);
    const VV = V.multiply(V);
    const VVV = VV.multiply(V);
    const V2VV = V2.multiply(VV);
    const W = Z1.multiply(Z2);
    const A = U.multiply(U)
      .multiply(W)
      .subtract(VVV)
      .subtract(V2VV.multiplyBI(BI.fromI32(2)));
    const X3 = V.multiply(A);
    const Y3 = U.multiply(V2VV.subtract(A)).subtract(VVV.multiply(U2));
    const Z3 = VVV.multiply(W);
    return this.createPoint(X3, Y3, Z3);
  }

  multiplyUnsafe(scalar: BI): PointG1 {
    let n = this.validateScalar(scalar);
    let point = this.getZero();
    let d: PointG1 = this;
    while (n.gt(BI.zero())) {
      if (n.bitAnd(BI_one).equals(BI_one)) point = point.add(d);
      d = d.double();
      n = n.rightShift(1);
    }
    return point;
  }

  private mulCurveMinusX(): PointG1 {
    return this.multiplyUnsafe(CURVE.x);
  }

  private mulCurveX(): PointG1 {
    return this.multiplyUnsafe(CURVE.x).negate();
  }

  equals(rhs: PointG1): boolean {
    const a = this;
    const b = rhs;
    // Ax * Bz == Bx * Az
    const xe = a.x.multiply(b.z).equals(b.x.multiply(a.z));
    // Ay * Bz == By * Az
    const ye = a.y.multiply(b.z).equals(b.y.multiply(a.z));
    return xe && ye;
  }

  private phi(): PointG1 {
    return new PointG1(this.x.multiplyBI(cubicRootOfUnityModP), this.y, this.z);
  }

  // Checks is the point resides in prime-order subgroup.
  // point.isTorsionFree() should return true for valid points
  // It returns false for shitty points.
  // https://eprint.iacr.org/2021/1130.pdf
  private isTorsionFree(): boolean {
    // todo: unroll
    const xP = this.mulCurveX(); // [x]P
    const u2P = xP.mulCurveMinusX(); // [u2]P
    return u2P.equals(this.phi());

    // https://eprint.iacr.org/2019/814.pdf
    // (z² − 1)/3
    // const c1 = 0x396c8c005555e1560000000055555555n;
    // const P = this;
    // const S = P.sigma();
    // const Q = S.double();
    // const S2 = S.sigma();
    // // [(z² − 1)/3](2σ(P) − P − σ²(P)) − σ²(P) = O
    // const left = Q.subtract(P).subtract(S2).multiplyUnsafe(c1);
    // const C = left.subtract(S2);
    // return C.isZero();
  }

  private isOnCurve(): boolean {
    const b = new Fp(CURVE.b);
    const x = this.x;
    const y = this.y;
    const z = this.z;
    const left = y
      .pow(BI.fromI32(2))
      .multiply(z)
      .subtract(x.pow(BI.fromI32(3)));
    const right = b.multiply(z.pow(BI.fromI32(3)));
    return left.subtract(right).isZero();
  }

  millerLoop(P: PointG2): Fp12 {
    const res = this.toAffine();
    return millerLoop(P.pairingPrecomputes(), res);
  }

  toAffine(invZ: Fp | null = null): Array<Fp> {
    const x = this.x;
    const y = this.y;
    const z = this.z;
    const is0 = this.isZero();
    if (invZ == null) invZ = is0 ? x : z.invert(); // x was chosen arbitrarily
    const ax = x.multiply(invZ);
    const ay = y.multiply(invZ);
    if (is0) return [Fp.ZERO, Fp.ZERO];
    if (invZ.isZero()) throw new Error('Invalid inverted z');
    return [ax, ay];
  }
}

class PointG2 {
  static BASE: PointG2 = new PointG2(Fp2.fromBigTuple(CURVE.G2x), Fp2.fromBigTuple(CURVE.G2y), Fp2.ONE);
  static ZERO: PointG2 = new PointG2(Fp2.ONE, Fp2.ONE, Fp2.ZERO);
  constructor(public readonly x: Fp2, public readonly y: Fp2, public readonly z: Fp2 = Fp2.ONE) {}

  static fromSignature(hex: Uint8Array): PointG2 {
    const P = CURVE.P;
    const half = hex.length / 2;
    if (half !== 48 && half !== 96) throw new Error('Invalid compressed signature length, must be 96 or 192');
    const z1 = bytesToNumberBE(hex.slice(0, half));
    const z2 = bytesToNumberBE(hex.slice(half));
    // Indicates the infinity point
    const bflag1 = mod(z1, POW_2_383).div(POW_2_382);
    if (bflag1.equals(BI_one)) return PointG2.ZERO;

    const x1 = new Fp(z1.mod(POW_2_381));
    const x2 = new Fp(z2);
    const x = new Fp2(x2, x1);
    const y2 = x.pow(BI.fromI32(3)).add(Fp2.fromBigTuple(CURVE.b2)); // y² = x³ + 4
    // The slow part
    let y = y2.sqrt();
    if (!y) throw new Error('Failed to find a square root');

    // Choose the y whose leftmost bit of the imaginary part is equal to the a_flag1
    // If y1 happens to be zero, then use the bit of y0
    const reim = y.reim();
    const y0 = reim.re;
    const y1 = reim.im;
    const aflag1 = z1.mod(POW_2_382).div(POW_2_381);
    const isGreater = y1.gt(BI.zero()) && y1.times(BI.fromI32(2)).div(P).notEqual(aflag1);
    const isZero = y1.equals(BI.zero()) && y0.times(BI.fromI32(2)).div(P).notEqual(aflag1);
    if (isGreater || isZero) y = y.multiplyBI(BI_neg_one);
    const point = new PointG2(x, y, Fp2.ONE);
    point.assertValidity();
    return point;
  }

  static hashToCurve(msg: Uint8Array): PointG2 {
    const u = hash_to_field(msg, 2);
    const x0xy = map_to_curve_simple_swu_9mod16(Fp2.fromBigTuple(u[0]));
    const x0 = x0xy[0];
    const y0 = x0xy[1];
    const x1y1 = map_to_curve_simple_swu_9mod16(Fp2.fromBigTuple(u[1]));
    const x1 = x1y1[0];
    const y1 = x1y1[1];
    const x2y2 = new PointG2(x0, y0).plus(new PointG2(x1, y1)).toAffine(null);
    const x2 = x2y2[0];
    const y2 = x2y2[1];
    const x3y3 = isogenyMapG2(x2, y2);
    const x3 = x3y3[0];
    const y3 = x3y3[1];
    return new PointG2(x3, y3).clearCofactor();
  }

  private psi(): PointG2 {
    const res = this.toAffine(null);
    return this.fromAffineTuple(psi(res[0], res[1]));
  }

  private psi2(): PointG2 {
    const res = this.toAffine(null);
    return this.fromAffineTuple(psi2(res[0], res[1]));
  }

  fromAffineTuple(xy: Array<Fp2>): PointG2 {
    return this.createPoint(xy[0], xy[1], Fp2.ONE);
  }

  createPoint(x: Fp2, y: Fp2, z: Fp2): PointG2 {
    return new PointG2(x, y, z);
  }

  private validateScalar(n: BI): BI {
    if (n.le(BI.zero()) || n.gt(CURVE.r)) {
      throw new Error(`Point#multiply: invalid scalar, expected positive integer < CURVE.r. Got: ${n}`);
    }
    return n;
  }

  getZero(): PointG2 {
    return this.createPoint(Fp2.ONE, Fp2.ONE, Fp2.ZERO);
  }

  double(): PointG2 {
    const x = this.x;
    const y = this.y;
    const z = this.z;
    const W = x.multiply(x).multiplyBI(BI.fromI32(3));
    const S = y.multiply(z);
    const SS = S.multiply(S);
    const SSS = SS.multiply(S);
    const B = x.multiply(y).multiply(S);
    const H = W.multiply(W).subtract(B.multiplyBI(BI.fromI32(8)));
    const X3 = H.multiply(S).multiplyBI(BI.fromI32(2));
    // W * (4 * B - H) - 8 * y * y * S_squared
    const Y3 = W.multiply(B.multiplyBI(BI.fromI32(4)).subtract(H)).subtract(
      y.multiply(y).multiplyBI(BI.fromI32(8)).multiply(SS)
    );
    const Z3 = SSS.multiplyBI(BI.fromI32(8));
    return this.createPoint(X3, Y3, Z3);
  }

  multiplyUnsafe(scalar: BI): PointG2 {
    let n = this.validateScalar(scalar);
    let point = this.getZero();
    let d: PointG2 = this;
    while (n.gt(BI.zero())) {
      if (n.bitAnd(BI_one).equals(BI_one)) point = point.plus(d);
      d = d.double();
      n = n.rightShift(1);
    }
    return point;
  }

  negate(): PointG2 {
    return this.createPoint(this.x, this.y.negate(), this.z);
  }

  private mulCurveX(): PointG2 {
    return this.multiplyUnsafe(CURVE.x).negate();
  }

  subtract(rhs: PointG2): PointG2 {
    return this.plus(rhs.negate());
  }

  clearCofactor(): PointG2 {
    const P = this;
    let t1 = P.mulCurveX(); // [-x]P
    let t2 = P.psi(); // Ψ(P)
    let t3 = P.double(); // 2P
    t3 = t3.psi2(); // Ψ²(2P)
    t3 = t3.subtract(t2); // Ψ²(2P) - Ψ(P)
    t2 = t1.plus(t2); // [-x]P + Ψ(P)
    t2 = t2.mulCurveX(); // [x²]P - [x]Ψ(P)
    t3 = t3.plus(t2); // Ψ²(2P) - Ψ(P) + [x²]P - [x]Ψ(P)
    t3 = t3.subtract(t1); // Ψ²(2P) - Ψ(P) + [x²]P - [x]Ψ(P) + [x]P
    const Q = t3.subtract(P); // Ψ²(2P) - Ψ(P) + [x²]P - [x]Ψ(P) + [x]P - 1P =>
    return Q; // [x²-x-1]P + [x-1]Ψ(P) + Ψ²(2P)
  }

  toAffine(invZ: Fp2 | null): Array<Fp2> {
    const x = this.x;
    const y = this.y;
    const z = this.z;
    const is0 = this.isZero();
    if (invZ == null) invZ = is0 ? x : z.invert(); // x was chosen arbitrarily
    const ax = x.multiply(invZ);
    const ay = y.multiply(invZ);
    if (is0) return [Fp2.ZERO, Fp2.ZERO];
    if (invZ.isZero()) throw new Error('Invalid inverted z');
    return [ax, ay];
  }

  isZero(): boolean {
    return this.z.isZero();
  }

  private isOnCurve(): boolean {
    const b = Fp2.fromBigTuple(CURVE.b2);
    const x = this.x;
    const y = this.y;
    const z = this.z;
    const left = y
      .pow(BI.fromI32(2))
      .multiply(z)
      .subtract(x.pow(BI.fromI32(3)));
    const right = b.multiply(z.pow(BI.fromI32(3)) as Fp2);
    return left.subtract(right).isZero();
  }

  equals(rhs: PointG2): boolean {
    const a = this;
    const b = rhs;
    // Ax * Bz == Bx * Az
    const xe = a.x.multiply(b.z).equals(b.x.multiply(a.z));
    // Ay * Bz == By * Az
    const ye = a.y.multiply(b.z).equals(b.y.multiply(a.z));
    return xe && ye;
  }

  private isTorsionFree(): boolean {
    const P = this;
    return P.mulCurveX().equals(P.psi()); // ψ(P) == [u](P)
    // https://eprint.iacr.org/2019/814.pdf
    // const psi2 = P.psi2();                        // Ψ²(P)
    // const psi3 = psi2.psi();                      // Ψ³(P)
    // const zPsi3 = psi3.mulNegX();                 // [z]Ψ³(P) where z = -x
    // return zPsi3.subtract(psi2).add(P).isZero();  // [z]Ψ³(P) - Ψ²(P) + P == O
  }

  assertValidity(): PointG2 {
    if (this.isZero()) return this;
    if (!this.isOnCurve()) throw new Error('Invalid G2 point: not on curve Fp2');
    if (!this.isTorsionFree()) throw new Error('Invalid G2 point: must be of prime-order subgroup');
    return this;
  }

  plus(rhs: PointG2): PointG2 {
    const p1 = this;
    const p2 = rhs;
    if (p1.isZero()) return p2;
    if (p2.isZero()) return p1;
    const X1 = p1.x;
    const Y1 = p1.y;
    const Z1 = p1.z;
    const X2 = p2.x;
    const Y2 = p2.y;
    const Z2 = p2.z;
    const U1 = Y2.multiply(Z1);
    const U2 = Y1.multiply(Z2);
    const V1 = X2.multiply(Z1);
    const V2 = X1.multiply(Z2);
    if (V1.equals(V2) && U1.equals(U2)) return this.double();
    if (V1.equals(V2)) return this.getZero();
    const U = U1.subtract(U2);
    const V = V1.subtract(V2);
    const VV = V.multiply(V);
    const VVV = VV.multiply(V);
    const V2VV = V2.multiply(VV);
    const W = Z1.multiply(Z2);
    const A = U.multiply(U)
      .multiply(W)
      .subtract(VVV)
      .subtract(V2VV.multiplyBI(BI.fromI32(2)));
    const X3 = V.multiply(A);
    const Y3 = U.multiply(V2VV.subtract(A)).subtract(VVV.multiply(U2));
    const Z3 = VVV.multiply(W);
    return this.createPoint(X3, Y3, Z3);
  }

  private _PPRECOMPUTES: Array<Array<Fp2>> | null = null;

  pairingPrecomputes(): Array<Array<Fp2>> {
    if (this._PPRECOMPUTES != null) return this._PPRECOMPUTES as Array<Array<Fp2>>;
    const affines = this.toAffine(null);
    this._PPRECOMPUTES = calcPairingPrecomputes(affines[0], affines[1]);
    return this._PPRECOMPUTES as Array<Array<Fp2>>;
  }
}

const xnum: Fp2_4 = [
  [
    biFromHex('0x171d6541fa38ccfaed6dea691f5fb614cb14b4e7f4e810aa22d6108f142b85757098e38d0f671c7188e2aaaaaaaa5ed1'),
    biFromHex('0x00')
  ],
  [
    biFromHex('0x11560bf17baa99bc32126fced787c88f984f87adf7ae0c7f9a208c6b4f20a4181472aaa9cb8d555526a9ffffffffc71e'),
    biFromHex('0x8ab05f8bdd54cde190937e76bc3e447cc27c3d6fbd7063fcd104635a790520c0a395554e5c6aaaa9354ffffffffe38d')
  ],
  [
    biFromHex('0x00'),
    biFromHex('0x11560bf17baa99bc32126fced787c88f984f87adf7ae0c7f9a208c6b4f20a4181472aaa9cb8d555526a9ffffffffc71a')
  ],
  [
    biFromHex('0x5c759507e8e333ebb5b7a9a47d7ed8532c52d39fd3a042a88b58423c50ae15d5c2638e343d9c71c6238aaaaaaaa97d6'),
    biFromHex('0x5c759507e8e333ebb5b7a9a47d7ed8532c52d39fd3a042a88b58423c50ae15d5c2638e343d9c71c6238aaaaaaaa97d6')
  ]
].map<Fp2>((pair) => Fp2.fromBigTuple(pair));
const xden: Fp2_4 = [
  [biFromHex('0x00'), biFromHex('0x00')],
  [biFromHex('0x01'), biFromHex('0x00')],
  [
    biFromHex('0x0c'),
    biFromHex('0x1a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaa9f')
  ],
  [
    biFromHex('0x00'),
    biFromHex('0x1a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaa63')
  ]
].map<Fp2>((pair) => Fp2.fromBigTuple(pair));
const ynum: Fp2_4 = [
  [
    biFromHex('0x124c9ad43b6cf79bfbf7043de3811ad0761b0f37a1e26286b0e977c69aa274524e79097a56dc4bd9e1b371c71c718b10'),
    biFromHex('0x00')
  ],
  [
    biFromHex('0x11560bf17baa99bc32126fced787c88f984f87adf7ae0c7f9a208c6b4f20a4181472aaa9cb8d555526a9ffffffffc71c'),
    biFromHex('0x8ab05f8bdd54cde190937e76bc3e447cc27c3d6fbd7063fcd104635a790520c0a395554e5c6aaaa9354ffffffffe38f')
  ],
  [
    biFromHex('0x00'),
    biFromHex('0x5c759507e8e333ebb5b7a9a47d7ed8532c52d39fd3a042a88b58423c50ae15d5c2638e343d9c71c6238aaaaaaaa97be')
  ],
  [
    biFromHex('0x1530477c7ab4113b59a4c18b076d11930f7da5d4a07f649bf54439d87d27e500fc8c25ebf8c92f6812cfc71c71c6d706'),
    biFromHex('0x1530477c7ab4113b59a4c18b076d11930f7da5d4a07f649bf54439d87d27e500fc8c25ebf8c92f6812cfc71c71c6d706')
  ]
].map<Fp2>((pair) => Fp2.fromBigTuple(pair));
const yden: Fp2_4 = [
  [biFromHex('0x01'), biFromHex('0x00')],
  [
    biFromHex('0x12'),
    biFromHex('0x1a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaa99')
  ],
  [
    biFromHex('0x00'),
    biFromHex('0x1a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffa9d3')
  ],
  [
    biFromHex('0x1a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffa8fb'),
    biFromHex('0x1a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffa8fb')
  ]
].map<Fp2>((pair) => Fp2.fromBigTuple(pair));

const BI_one = BI.fromI32(1);
const BI_neg_one = BI.fromI32(-1);
const POW_2_381 = BI.fromString(
  '4925250774549309901534880012517951725634967408808180833493536675530715221437151326426783281860614455100828498788352'
);
const POW_2_382 = POW_2_381.times(BI.fromI32(2));
const POW_2_383 = POW_2_382.times(BI.fromI32(2));
const hexes = initHexes();
const BLS_X_LEN = bitLen(CURVE.x);
const cubicRootOfUnityModP = biFromHex(
  '0x5f19672fdf76ce51ba69c6076a0f77eaddb3a93be6f89688de17d813620a00022e01fffffffefffe'
);
const P_MINUS_9_DIV_16: BI = CURVE.P.pow(2).minus(BI.fromI32(9)).div(BI.fromI32(16));
const ISOGENY_COEFFICIENTS_G2: Array<Fp2_4> = [xnum, xden, ynum, yden];
const ut_root = new Fp6(Fp2.ZERO, Fp2.ONE, Fp2.ZERO);
const wsq = new Fp12(ut_root, Fp6.ZERO);
const wcu = new Fp12(Fp6.ZERO, ut_root);
const wsq_inv_wcu_inv = genInvertBatchFp12([wsq, wcu]);
const wsq_inv = wsq_inv_wcu_inv[0];
const wcu_inv = wsq_inv_wcu_inv[1];

const FP2_FROBENIUS_COEFFICIENTS: Array<Fp> = [
  biFromHex('0x01'),
  biFromHex('0x1a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaaaa')
].map<Fp>((item) => new Fp(item));

const FP6_FROBENIUS_COEFFICIENTS_1: Array<Fp2> = [
  [biFromHex('0x01'), biFromHex('0x00')],
  [
    biFromHex('0x00'),
    biFromHex('0x1a0111ea397fe699ec02408663d4de85aa0d857d89759ad4897d29650fb85f9b409427eb4f49fffd8bfd00000000aaac')
  ],
  [
    biFromHex('0x00000000000000005f19672fdf76ce51ba69c6076a0f77eaddb3a93be6f89688de17d813620a00022e01fffffffefffe'),
    biFromHex('0x00')
  ],
  [biFromHex('0x00'), biFromHex('0x01')],
  [
    biFromHex('0x1a0111ea397fe699ec02408663d4de85aa0d857d89759ad4897d29650fb85f9b409427eb4f49fffd8bfd00000000aaac'),
    biFromHex('0x00')
  ],
  [
    biFromHex('0x00'),
    biFromHex('0x00000000000000005f19672fdf76ce51ba69c6076a0f77eaddb3a93be6f89688de17d813620a00022e01fffffffefffe')
  ]
].map<Fp2>((pair) => Fp2.fromBigTuple(pair));

const FP6_FROBENIUS_COEFFICIENTS_2: Array<Fp2> = [
  [biFromHex('0x01'), biFromHex('0x00')],
  [
    biFromHex('0x1a0111ea397fe699ec02408663d4de85aa0d857d89759ad4897d29650fb85f9b409427eb4f49fffd8bfd00000000aaad'),
    biFromHex('0x00')
  ],
  [
    biFromHex('0x1a0111ea397fe699ec02408663d4de85aa0d857d89759ad4897d29650fb85f9b409427eb4f49fffd8bfd00000000aaac'),
    biFromHex('0x00')
  ],
  [
    biFromHex('0x1a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaaaa'),
    biFromHex('0x00')
  ],
  [
    biFromHex('0x00000000000000005f19672fdf76ce51ba69c6076a0f77eaddb3a93be6f89688de17d813620a00022e01fffffffefffe'),
    biFromHex('0x00')
  ],
  [
    biFromHex('0x00000000000000005f19672fdf76ce51ba69c6076a0f77eaddb3a93be6f89688de17d813620a00022e01fffffffeffff'),
    biFromHex('0x00')
  ]
].map<Fp2>((pair) => Fp2.fromBigTuple(pair));

const FP12_FROBENIUS_COEFFICIENTS: Array<Fp2> = [
  [biFromHex('0x01'), biFromHex('0x00')],
  [
    biFromHex('0x1904d3bf02bb0667c231beb4202c0d1f0fd603fd3cbd5f4f7b2443d784bab9c4f67ea53d63e7813d8d0775ed92235fb8'),
    biFromHex('0x00fc3e2b36c4e03288e9e902231f9fb854a14787b6c7b36fec0c8ec971f63c5f282d5ac14d6c7ec22cf78a126ddc4af3')
  ],
  [
    biFromHex('0x00000000000000005f19672fdf76ce51ba69c6076a0f77eaddb3a93be6f89688de17d813620a00022e01fffffffeffff'),
    biFromHex('0x00')
  ],
  [
    biFromHex('0x135203e60180a68ee2e9c448d77a2cd91c3dedd930b1cf60ef396489f61eb45e304466cf3e67fa0af1ee7b04121bdea2'),
    biFromHex('0x06af0e0437ff400b6831e36d6bd17ffe48395dabc2d3435e77f76e17009241c5ee67992f72ec05f4c81084fbede3cc09')
  ],
  [
    biFromHex('0x00000000000000005f19672fdf76ce51ba69c6076a0f77eaddb3a93be6f89688de17d813620a00022e01fffffffefffe'),
    biFromHex('0x00')
  ],
  [
    biFromHex('0x144e4211384586c16bd3ad4afa99cc9170df3560e77982d0db45f3536814f0bd5871c1908bd478cd1ee605167ff82995'),
    biFromHex('0x05b2cfd9013a5fd8df47fa6b48b1e045f39816240c0b8fee8beadf4d8e9c0566c63a3e6e257f87329b18fae980078116')
  ],
  [
    biFromHex('0x1a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaaaa'),
    biFromHex('0x00')
  ],
  [
    biFromHex('0x00fc3e2b36c4e03288e9e902231f9fb854a14787b6c7b36fec0c8ec971f63c5f282d5ac14d6c7ec22cf78a126ddc4af3'),
    biFromHex('0x1904d3bf02bb0667c231beb4202c0d1f0fd603fd3cbd5f4f7b2443d784bab9c4f67ea53d63e7813d8d0775ed92235fb8')
  ],
  [
    biFromHex('0x1a0111ea397fe699ec02408663d4de85aa0d857d89759ad4897d29650fb85f9b409427eb4f49fffd8bfd00000000aaac'),
    biFromHex('0x00')
  ],
  [
    biFromHex('0x06af0e0437ff400b6831e36d6bd17ffe48395dabc2d3435e77f76e17009241c5ee67992f72ec05f4c81084fbede3cc09'),
    biFromHex('0x135203e60180a68ee2e9c448d77a2cd91c3dedd930b1cf60ef396489f61eb45e304466cf3e67fa0af1ee7b04121bdea2')
  ],
  [
    biFromHex('0x1a0111ea397fe699ec02408663d4de85aa0d857d89759ad4897d29650fb85f9b409427eb4f49fffd8bfd00000000aaad'),
    biFromHex('0x00')
  ],
  [
    biFromHex('0x05b2cfd9013a5fd8df47fa6b48b1e045f39816240c0b8fee8beadf4d8e9c0566c63a3e6e257f87329b18fae980078116'),
    biFromHex('0x144e4211384586c16bd3ad4afa99cc9170df3560e77982d0db45f3536814f0bd5871c1908bd478cd1ee605167ff82995')
  ]
].map<Fp2>((n) => Fp2.fromBigTuple(n));

const rv1 = biFromHex(
  '0x6af0e0437ff400b6831e36d6bd17ffe48395dabc2d3435e77f76e17009241c5ee67992f72ec05f4c81084fbede3cc09'
);
const ev1 = biFromHex(
  '0x699be3b8c6870965e5bf892ad5d2cc7b0e85a117402dfd83b7f4a947e02d978498255a2aaec0ac627b5afbdf1bf1c90'
);
const ev2 = biFromHex(
  '0x8157cd83046453f5dd0972b6e3949e4288020b5b8a9cc99ca07e27089a2ce2436d965026adad3ef7baba37f2183e9b5'
);
const ev3 = biFromHex(
  '0xab1c2ffdd6c253ca155231eb3e71ba044fd562f6f72bc5bad5ec46a0b7a3b0247cf08ce6c6317f40edbc653a72dee17'
);
const ev4 = biFromHex(
  '0xaa404866706722864480885d68ad0ccac1967c7544b447873cc37e0181271e006df72162a3d3e0287bf597fbf7f8fc1'
);

const FP2_ROOTS_OF_UNITY: Array<Fp2> = [
  [BI_one, BI.zero()],
  [rv1, rv1.times(BI_neg_one)],
  [BI.zero(), BI_one],
  [rv1, rv1],
  [BI_neg_one, BI.zero()],
  [rv1.times(BI_neg_one), rv1],
  [BI.zero(), BI_neg_one],
  [rv1.times(BI_neg_one), rv1.times(BI_neg_one)]
].map<Fp2>((pair) => Fp2.fromBigTuple(pair));

const FP2_ETAs: Array<Fp2> = [
  [ev1, ev2],
  [ev2.times(BI_neg_one), ev1],
  [ev3, ev4],
  [ev4.times(BI_neg_one), ev3]
].map<Fp2>((pair) => Fp2.fromBigTuple(pair));

const PSI2_C1 = biFromHex(
  '0x1a0111ea397fe699ec02408663d4de85aa0d857d89759ad4897d29650fb85f9b409427eb4f49fffd8bfd00000000aaac'
);

function biFromHex(hex: string): BI {
  if (hex.startsWith('0x')) hex = hex.substr(2);
  if (hex.length % 2 == 1) {
    hex = '0' + hex;
  }
  return BI.fromUnsignedBytes(Bytes.fromHexString(hex).reverse() as Bytes);
}

function invert(num: BI, modulo: BI = CURVE.P): BI {
  const _0n = BI.zero();
  const _1n = BI_one;
  if (num.equals(_0n) || modulo.le(_0n)) {
    throw new Error(`invert: expected positive integers, got n=${num} mod=${modulo}`);
  }
  let a = mod(num, modulo);
  let b = modulo;
  // prettier-ignore
  let x = _0n, y = _1n, u = _1n, v = _0n;
  while (!a.equals(_0n)) {
    const q = b.div(a);
    const r = b.mod(a);
    const m = x.minus(u.times(q));
    const n = y.minus(v.times(q));
    // prettier-ignore
    b = a, a = r, x = u, y = v, u = m, v = n;
  }
  const gcd = b;
  if (!gcd.equals(_1n)) throw new Error('invert: does not exist');
  return mod(x, modulo);
}

function bitLen(n: BI): i32 {
  let len: i32;
  for (len = 0; n.gt(BI.zero()); n = n.rightShift(1), len += 1);
  return len;
}

function powMod_FQP(fqp: Fp2, fqpOne: Fp2, n: BI): Fp2 {
  const elm = fqp;
  if (n.equals(BI.zero())) return fqpOne;
  if (n.equals(BI_one)) return elm;
  let p = fqpOne;
  let d = elm;
  while (n.gt(BI.zero())) {
    if (n.bitAnd(BI_one).equals(BI_one)) p = p.multiply(d);
    n = n.rightShift(1);
    d = d.square();
  }
  return p;
}

function initHexes(): Array<string> {
  const hexes = new Array<string>(256);
  for (let i = 0; i < 256; i++) {
    const hex = (i + 0x100).toString(16).substr(1);
    hexes[i] = hex;
  }
  return hexes;
}

function bytesToHex(uint8a: Uint8Array): string {
  let hex = '';
  for (let i = 0; i < uint8a.length; i++) {
    hex += hexes[uint8a[i]];
  }
  return hex;
}

function bytesToNumberBE(bytes: Uint8Array): BI {
  return biFromHex('0x' + bytesToHex(bytes));
}

function mod(a: BI, b: BI): BI {
  const res = a.mod(b);
  return res.ge(BI.zero()) ? res : res.plus(b);
}

function powMod(num: BI, power: BI, modulo: BI): BI {
  if (modulo.le(BI.zero()) || power.lt(BI.zero())) throw new Error('Expected power/modulo > 0');
  if (modulo.equals(BI_one)) return BI.zero();
  let res = BI_one;
  while (power.gt(BI.zero())) {
    if (power.bitAnd(BI.fromI32(1)).equals(BI.fromI32(1))) {
      res = res.times(num).mod(modulo);
    }
    num = num.times(num).mod(modulo);
    power = power.rightShift(1);
  }
  return res;
}

function genZeroes(nb: i32): string {
  return ' '.repeat(nb);
}

function bitGet(n: BI, pos: u8): boolean {
  return n.rightShift(pos).bitAnd(BI_one).equals(BI_one);
}

function millerLoop(ell: Array<Array<Fp2>>, g1: Array<Fp>): Fp12 {
  const Px = g1[0].value;
  const Py = g1[1].value;
  let f12 = Fp12.ONE;
  for (let j = 0, i = BLS_X_LEN - 2; i >= 0; i--, j++) {
    const E = ell[j];
    f12 = f12.multiplyBy014(E[0], E[1].multiplyBI(Px), E[2].multiplyBI(Py));
    if (bitGet(CURVE.x, u8(i))) {
      j += 1;
      const F = ell[j];
      f12 = f12.multiplyBy014(F[0], F[1].multiplyBI(Px), F[2].multiplyBI(Py));
    }
    if (i !== 0) f12 = f12.square();
  }
  return f12.conjugate();
}

function concatBytes(arrays: Uint8Array[]): Uint8Array {
  if (arrays.length === 1) return arrays[0];
  const length = arrays.reduce((a, arr) => a + arr.length, 0);
  const result = new Uint8Array(length);
  for (let i = 0, pad = 0; i < arrays.length; i++) {
    const arr = arrays[i];
    result.set(arr, pad);
    pad += arr.length;
  }
  return result;
}

function stringToBytes(str: string): Uint8Array {
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    bytes[i] = str.charCodeAt(i);
  }
  return bytes;
}

function i2osp(value: i32, length: i32): Uint8Array {
  if (value < 0 || value >= 1 << (8 * length)) {
    throw new Error(`bad I2OSP call: value=${value} length=${length}`);
  }
  const res = new Uint8Array(length).fill(0);
  for (let i = length - 1; i >= 0; i--) {
    res[i] = value & 0xff;
    value >>>= 8;
  }
  return res;
}

function os2ip(bytes: Uint8Array): BI {
  let result = BI.zero();
  for (let i = 0; i < bytes.length; i++) {
    result = result.leftShift(8);
    result = result.plus(BI.fromI32(bytes[i]));
  }
  return result;
}

function strxor(a: Uint8Array, b: Uint8Array): Uint8Array {
  const arr = new Uint8Array(a.length);
  for (let i = 0; i < a.length; i++) {
    arr[i] = a[i] ^ b[i];
  }
  return arr;
}

function expand_message_xmd(msg: Uint8Array, DST: Uint8Array, lenInBytes: f64, H: Hash = sha256): Uint8Array {
  // https://datatracker.ietf.org/doc/html/draft-irtf-cfrg-hash-to-curve-16#section-5.3.3
  if (DST.length > 255) DST = H(concatBytes([stringToBytes('H2C-OVERSIZE-DST-'), DST]));
  const b_in_bytes = f64(32);
  const r_in_bytes = b_in_bytes * 2;
  const ell: i32 = i32(Math.ceil(lenInBytes / b_in_bytes));
  if (ell > 255) throw new Error('Invalid xmd length');
  const DST_prime = concatBytes([DST, i2osp(DST.length, 1)]);
  const Z_pad = i2osp(0, i32(r_in_bytes));
  const l_i_b_str = i2osp(i32(lenInBytes), 2);
  const b = new Array<Uint8Array>(ell);
  const b_0 = H(concatBytes([Z_pad, msg, l_i_b_str, i2osp(0, 1), DST_prime]));
  b[0] = H(concatBytes([b_0, i2osp(1, 1), DST_prime]));
  for (let i = 1; i <= ell; i++) {
    const args = [strxor(b_0, b[i - 1]), i2osp(i + 1, 1), DST_prime];
    b[i] = H(concatBytes(args));
  }
  const pseudo_random_bytes = concatBytes(b);
  return pseudo_random_bytes.slice(0, i32(lenInBytes));
}

function hash_to_field(msg: Uint8Array, count: number): Array<Array<BI>> {
  // if options is provided but incomplete, fill any missing fields with the
  // value in hftDefaults (ie hash to G2).
  const htfOptions: Htf = htfDefaults;
  // const log2p = htfOptions.p.toString(2).length;
  let clone = htfOptions.p;
  let bitCount = 0;
  for (; clone.gt(BI.zero()); bitCount += 1) {
    clone = clone.rightShift(1);
  }
  const L = i32(Math.ceil((bitCount + htfOptions.k) / f64(8))); // section 5.1 of ietf draft link above
  const len_in_bytes = count * htfOptions.m * L;
  const DST = stringToBytes(htfOptions.DST);

  let pseudo_random_bytes = msg;
  if (htfOptions.expand) {
    pseudo_random_bytes = expand_message_xmd(msg, DST, len_in_bytes, htfOptions.hash);
  }
  const u = new Array<Array<BI>>(i32(count));
  for (let i = 0; i < count; i++) {
    const e = new Array<BI>(htfOptions.m);
    for (let j = 0; j < htfOptions.m; j++) {
      const elm_offset = L * (j + i * htfOptions.m);
      const tv = pseudo_random_bytes.subarray(elm_offset, elm_offset + L);
      e[j] = mod(os2ip(tv), htfOptions.p);
    }
    u[i] = e;
  }
  return u;
}

function sqrt_div_fp2(u: Fp2, v: Fp2): SqrtResult {
  const v7 = v.pow(BI.fromI32(7));
  const uv7 = u.multiply(v7);
  const uv15 = uv7.multiply(v7.multiply(v));
  // gamma =  uv⁷ * (uv¹⁵)^((p² - 9) / 16)
  const gamma = uv15.pow(P_MINUS_9_DIV_16).multiply(uv7);
  let success = false;
  let result = gamma;
  // Constant-time routine, so we do not early-return.
  for (let i = 0; i < 4; i++) {
    const root = FP2_ROOTS_OF_UNITY[i];
    const candidate = root.multiply(gamma);
    if (candidate.pow(BI.fromI32(2)).multiply(v).subtract(u).isZero() && !success) {
      success = true;
      result = candidate;
    }
  }
  return { success, sqrtCandidateOrGamma: result };
}

function sgn0_fp2(x: Fp2): BI {
  const reim = x.reim();
  const x0 = reim.re;
  const x1 = reim.im;
  const sign_0 = x0.mod(BI.fromI32(2)).equals(BI_one);
  const zero_0 = x0.equals(BI.zero());
  const sign_1 = x1.mod(BI.fromI32(2)).equals(BI_one);
  return BI.fromI32(sign_0 || (zero_0 && sign_1) ? 1 : 0);
}

function map_to_curve_simple_swu_9mod16(t: Fp2): Array<Fp2> {
  const iso_3_a = new Fp2(new Fp(BI.zero()), new Fp(BI.fromI32(240)));
  const iso_3_b = new Fp2(new Fp(BI.fromI32(1012)), new Fp(BI.fromI32(1012)));
  const iso_3_z = new Fp2(new Fp(BI.fromI32(-2)), new Fp(BI.fromI32(-1)));
  // if (Array.isArray(t)) t = Fp2.fromBigTuple(t);

  const t2 = t.pow(BI.fromI32(2));
  const iso_3_z_t2 = iso_3_z.multiply(t2);
  const ztzt = iso_3_z_t2.add(iso_3_z_t2.pow(BI.fromI32(2))); // (Z * t² + Z² * t⁴)
  let denominator = iso_3_a.multiply(ztzt).negate(); // -a(Z * t² + Z² * t⁴)
  let numerator = iso_3_b.multiply(ztzt.add(Fp2.ONE)); // b(Z * t² + Z² * t⁴ + 1)

  // Exceptional case
  if (denominator.isZero()) denominator = iso_3_z.multiply(iso_3_a);

  // v = D³
  let v = denominator.pow(BI.fromI32(3));
  // u = N³ + a * N * D² + b * D³
  let u = numerator
    .pow(BI.fromI32(3))
    .add(iso_3_a.multiply(numerator).multiply(denominator.pow(BI.fromI32(2))))
    .add(iso_3_b.multiply(v));
  // Attempt y = sqrt(u / v)
  const success_sqrtCandidateOrGamma = sqrt_div_fp2(u, v);
  const success = success_sqrtCandidateOrGamma.success;
  const sqrtCandidateOrGamma = success_sqrtCandidateOrGamma.sqrtCandidateOrGamma;
  let y: Fp2;
  if (success) y = sqrtCandidateOrGamma;
  // Handle case where (u / v) is not square
  // sqrt_candidate(x1) = sqrt_candidate(x0) * t³
  const sqrtCandidateX1 = sqrtCandidateOrGamma.multiply(t.pow(BI.fromI32(3)));

  // u(x1) = Z³ * t⁶ * u(x0)
  u = iso_3_z_t2.pow(BI.fromI32(3)).multiply(u);
  let success2 = false;
  for (let i = 0; i < FP2_ETAs.length; i++) {
    const eta = FP2_ETAs[i];
    const etaSqrtCandidate = eta.multiply(sqrtCandidateX1);
    const temp = etaSqrtCandidate.pow(BI.fromI32(2)).multiply(v).subtract(u);
    if (temp.isZero() && !success && !success2) {
      y = etaSqrtCandidate;
      success2 = true;
    }
  }
  if (!success && !success2) throw new Error('Hash to Curve - Optimized SWU failure');
  if (success2) numerator = numerator.multiply(iso_3_z_t2);
  y = y! as Fp2;
  if (sgn0_fp2(t).notEqual(sgn0_fp2(y))) y = y.negate();
  return [numerator.div(denominator), y];
}

function isogenyMap(COEFF: Array<Fp2_4>, x: Fp2, y: Fp2): Array<Fp2> {
  const res = new Array<Fp2>(0);
  for (let idx = 0; idx < COEFF.length; idx++) {
    const val = COEFF[idx];
    let acc = val[0];
    for (let i = 1; i < val.length; i++) {
      acc = acc.multiply(x).add(val[i]);
    }
    res.push(acc);
  }
  const xNum: Fp2 = res[0];
  const xDen: Fp2 = res[1];
  const yNum: Fp2 = res[2];
  const yDen: Fp2 = res[3];
  x = xNum.div(xDen); // xNum / xDen
  y = y.multiply(yNum.div(yDen)); // y * (yNum / yDev)
  return [x, y];
}
const isogenyMapG2 = (x: Fp2, y: Fp2): Array<Fp2> => isogenyMap(ISOGENY_COEFFICIENTS_G2, x, y);

function genInvertBatchFp12(nums: Fp12[]): Fp12[] {
  const tmp = new Array<Fp12>(nums.length);
  // Walk from first to last, multiply them by each other MOD p
  let racc = Fp12.ONE;
  for (let i = 0; i < nums.length; i++) {
    if (nums[i].isZero()) {
      continue;
    }
    tmp[i] = racc;
    racc = racc.multiply(nums[i]);
  }
  const lastMultiplied = racc;

  // Invert last element
  const inverted = lastMultiplied.invert();
  // Walk from last to first, multiply them by inverted each other MOD p
  let rracc = inverted;
  for (let i = nums.length - 1; i >= 0; i--) {
    if (nums[i].isZero()) {
      continue;
    }
    tmp[i] = rracc.multiply(tmp[i]);
    rracc = rracc.multiply(nums[i]);
  }
  return tmp;
}

function psi(x: Fp2, y: Fp2): Array<Fp2> {
  // Untwist Fp2->Fp12 && frobenius(1) && twist back
  const x2 = wsq_inv.multiplyByFp2(x).frobeniusMap(1).multiply(wsq).c0.c0;
  const y2 = wcu_inv.multiplyByFp2(y).frobeniusMap(1).multiply(wcu).c0.c0;
  return [x2, y2];
}

function psi2(x: Fp2, y: Fp2): Array<Fp2> {
  return [x.multiplyBI(PSI2_C1), y.negate()];
}

function calcPairingPrecomputes(x: Fp2, y: Fp2): Array<Array<Fp2>> {
  // prettier-ignore
  const Qx = x, Qy = y, Qz = Fp2.ONE;
  // prettier-ignore
  let Rx = Qx, Ry = Qy, Rz = Qz;
  let ell_coeff: Array<Array<Fp2>> = [];
  for (let i = BLS_X_LEN - 2; i >= 0; i--) {
    // Double
    let t0 = Ry.square(); // Ry²
    let t1 = Rz.square(); // Rz²
    let t2 = t1.multiplyBI(BI.fromI32(3)).multiplyByB(); // 3 * T1 * B
    let t3 = t2.multiplyBI(BI.fromI32(3)); // 3 * T2
    let t4 = Ry.add(Rz).square().subtract(t1).subtract(t0); // (Ry + Rz)² - T1 - T0
    ell_coeff.push([
      t2.subtract(t0), // T2 - T0
      Rx.square().multiplyBI(BI.fromI32(3)), // 3 * Rx²
      t4.negate() // -T4
    ]);
    Rx = t0.subtract(t3).multiply(Rx).multiply(Ry).divBI(BI.fromI32(2)); // ((T0 - T3) * Rx * Ry) / 2
    Ry = t0
      .add(t3)
      .divBI(BI.fromI32(2))
      .square()
      .subtract(t2.square().multiplyBI(BI.fromI32(3))); // ((T0 + T3) / 2)² - 3 * T2²
    Rz = t0.multiply(t4); // T0 * T4
    if (bitGet(CURVE.x, u8(i))) {
      // Addition
      let t0 = Ry.subtract(Qy.multiply(Rz)); // Ry - Qy * Rz
      let t1 = Rx.subtract(Qx.multiply(Rz)); // Rx - Qx * Rz
      ell_coeff.push([
        t0.multiply(Qx).subtract(t1.multiply(Qy)), // T0 * Qx - T1 * Qy
        t0.negate(), // -T0
        t1 // T1
      ]);
      let t2 = t1.square(); // T1²
      let t3 = t2.multiply(t1); // T2 * T1
      let t4 = t2.multiply(Rx); // T2 * Rx
      let t5 = t3.subtract(t4.multiplyBI(BI.fromI32(2))).add(t0.square().multiply(Rz)); // T3 - 2 * T4 + T0² * Rz
      Rx = t1.multiply(t5); // T1 * T5
      Ry = t4.subtract(t5).multiply(t0).subtract(t3.multiply(Ry)); // (T4 - T5) * T0 - T3 * Ry
      Rz = Rz.multiply(t3); // Rz * T3
    }
  }
  return ell_coeff;
}

function normP1(point: Uint8Array): PointG1 {
  return PointG1.fromHex(point);
}
function normP2(point: Uint8Array): PointG2 {
  return PointG2.fromSignature(point);
}
function normP2Hash(point: Uint8Array): PointG2 {
  return PointG2.hashToCurve(point);
}

function pairing(P: PointG1, Q: PointG2, withFinalExponent: boolean = true): Fp12 {
  if (P.isZero() || Q.isZero()) throw new Error('No pairings at point of Infinity');
  P.assertValidity();
  Q.assertValidity();
  const looped = P.millerLoop(Q);
  return withFinalExponent ? looped.finalExponentiate() : looped;
}

export function verify(signature: Uint8Array, message: Uint8Array, publicKey: Uint8Array): boolean {
  const P = normP1(publicKey);
  const Hm = normP2Hash(message);
  const G = PointG1.BASE;
  const S = normP2(signature);
  const ePHm = pairing(P.negate(), Hm, false);
  const eGS = pairing(G, S, false);
  const exp = eGS.multiply(ePHm).finalExponentiate();
  return exp.equals(Fp12.ONE);
}
