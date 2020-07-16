import path from 'path';
import program from 'commander';

function run(task: (args: any) => Promise<any>, options?: any) {
  return task(options);
}

export const options = program.opts();

options.dirname = path.resolve(__dirname, '..');
options.debug = !options.release;

export default run;
