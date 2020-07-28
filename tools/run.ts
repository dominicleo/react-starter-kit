import path from 'path';
import program from 'commander';

export function format(time: Date) {
  return time.toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, '$1');
}

function run(task: (args: any) => Promise<any>, options?: any) {
  const start = new Date();
  console.info(`[${format(start)}] Starting '${task.name}'...`);
  return task(options).then((resolution) => {
    const end = new Date();
    const time = end.getTime() - start.getTime();
    console.info(`[${format(end)}] Finished '${task.name}' after ${time} ms`);
    return resolution;
  });
}

export const options = program.opts();

options.dirname = path.resolve(__dirname, '..');
options.debug = !options.release;

export default run;
