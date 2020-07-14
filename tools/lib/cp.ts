import cp, { ExecOptions } from 'child_process';
import execa, { Options } from 'execa';

export const spawn = (command: string, args: string[], options: Options) =>
  execa(command, args, {
    stdio: ['ignore', 'inherit', 'inherit'],
    ...options,
  });

export const exec = (command: string, options: ExecOptions) =>
  new Promise((resolve, reject) => {
    cp.exec(command, options, (err, stdout, stderr) => {
      if (err) {
        reject(err);
        return;
      }

      resolve({ stdout, stderr });
    });
  });

export default { spawn, exec };
