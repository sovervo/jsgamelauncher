import { program, Option } from 'commander';

export default function getOptions() {
  program
    .allowUnknownOption()
    .name('js game launcher')
    .description('js game launcher')
    .version('1.0')
    .addOption(new Option('-rom <string>', 'rom name (directory of javascript game)'))
    .addOption(new Option('-fs, -fullscreen', 'fullscreen mode'))
    .addOption(new Option('-aa, -antialiasing, -antialias', 'antialias mode'))
    .addOption(new Option('-s, -stretch', 'ignore aspect ratio, stretch to fit window'))
    .addOption(new Option('-is, -integerscaling', 'only scale by integer values (possible black bars top and bottom)'))
    .parse();

  const options = program.opts();
  return options;
};
