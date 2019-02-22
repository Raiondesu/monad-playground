const clients = {
  anna: 10,
  bob: 0
} as {
  [name: string]: number;
};

type AspectsCollection = { [key: string]: Function };

type FunctionalKeysOf<T extends object> = {
  [key in keyof T]: T[key] extends Function ? key : never;
}[keyof T];

type AspectsOf<R extends object, T extends Exclude<Aspectable, R> = Exclude<Aspectable, R>> = {
  [key in FunctionalKeysOf<T>]?: T[key] extends (...args: any[]) => any ? (func: T[key]) => (...args: Parameters<T[key]>) => ReturnType<T[key]> : never;
};

abstract class Aspects {
  private static readonly _aspects: AspectsCollection = {};
  private get _aspects(): AspectsCollection {
    return (this.constructor as typeof Aspects)._aspects;
  }

  public advice(name: string, handler: Function) {
    this._aspects[name] = handler;
  }
}

abstract class Aspectable {
  private static readonly _aspects: AspectsCollection = {};
  private get _aspects(): AspectsCollection {
    return (this.constructor as typeof Aspectable)._aspects;
  }

  protected acceptAdvice(name: string, ...args: any[]) {
    (this._aspects[name] || (() => {}))(...args);
  }
}

const AspectsOf = function AspectsOf<T extends typeof Aspectable>(target: T) {
  return (aspects: any) => {
    aspects._aspects = { ...aspects._aspects, ...(target as any)._aspects};

    const protoMaster: any = new aspects();
    const protoSlave: any = target.prototype;
    Object.keys(protoSlave).forEach(key => {
      if (key !== 'constructor' && typeof protoMaster[key] === 'function') {
        console.log(key, 'of', target.name);
        console.log('old', protoSlave[key]);

        protoSlave[key] = protoMaster[key](protoSlave[key]) || protoSlave[key];
      }
    });

    return aspects;
  };
};

class Transaction extends Aspectable {
  public transfer(from: string, to: string, amount: number, userCredentials: string) {
    if (!userCredentials) {
      return this.acceptAdvice('no-credentials');
    }

    clients[from] -= amount;
    this.acceptAdvice('mid-transaction', 'mid-transaction');
    clients[to] += amount;

    return;
  }
}

@AspectsOf(Transaction)
class TransactionLogs extends Aspects implements AspectsOf<Transaction> {
  public transfer = (target: Transaction['transfer']) => {
    this.advice('mid-transaction', console.log);
    this.advice('no-credentials', () => {
      throw new Error('User has no credentials!');
    });

    return function transfer(this: Transaction, from: string, to: string, amount: number, userCredentials: string) {
      console.log('transaction of', amount,'started from', from, 'and', to);

      if (clients[from] < amount) {
        console.error(from, 'lacks', amount - clients[from]);
        console.error('aborting transaction');

        throw new Error('Not enough money');
      }

      const result = target.apply(this, [from, to, amount, userCredentials]);

      console.log('transaction completed');

      return result;
    };
  };
}
