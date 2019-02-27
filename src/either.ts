function either<L, R>(l: L, r: R) {
  return typeof l === 'undefined' ? r : l;
}

export class Either<E, R> {
  private constructor(public readonly left: E, public readonly right: R) {}

  public get isLeft(): boolean {
    return typeof this.left !== 'undefined';
  }

  public get isRight(): boolean {
    return !this.isLeft;
  }

  public chain<L, T>(f: (v: R) => Either<L, T>): Either<L | E, T> {
    const r = this.isRight ? f(this.right) : this as any;

    return new Either(either(r.left, this.left), either(r.right, this.right));
  }

  public map<T>(f: (v: R) => T): Either<E, T> {
    return this.isRight ? new Either(this.left, f(this.right)) : this as any;
  }

  public catchMap<T>(f: (v: E) => T): Either<T, R> {
    return this.isLeft ? new Either(f(this.left), this.right) : this as any;
  }

  public catch<L>(f: (e: E, v?: any) => Either<L, R>): Either<L, R> {
    return this.isLeft ? f(this.left, this.right) : this as any;
  }

  public cata<X>(leftF: (e: E) => X, rightF: (v: R) => X): X {
    return this.isLeft ? leftF(this.left) : rightF(this.right);
  }

  public apply<B extends Either<E, (arg: R) => any>, Right = B extends Either<E, (arg: R) => infer T> ? T : any>(v: B): Either<E, Right> {
    return new Either(v.left, v.right(this.right));
  }

  public swap() {
    return new Either(this.right, this.left);
  }

  public contains<T extends E | R>(v: T): boolean {
    return this.left === v || this.right === v;
  }

  public get raw() {
    return either(this.left, this.right);
  }

  public static left<T>(v: T) {
    return new Either(v, undefined as never);
  }

  public static right<T>(v: T) {
    return new Either(undefined as never, v);
  }
}

export function Left<T>(v: T) {
  return Either.left(v);
}

export function Right<T>(v: T) {
  return Either.right(v);
}
