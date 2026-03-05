import { Command } from 'commander';
import chalk from 'chalk';
import { createDiagramCommand } from './commands/diagram.js';
import { detectTerminalCaps } from './caps/detect.js';
import { CACHE_DIR } from '@termviz/core';

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const program = new Command();

program
    .name('termviz')
    .description(
        chalk.bold('termviz') +
        ' — render diagrams and UI previews inline in any terminal\n' +
        chalk.dim('  Mermaid → PNG → Kitty / iTerm2 / SIXEL / ASCII fallback'),
    )
    .version('0.1.0', '-v, --version', 'Print version')
    .addCommand(createDiagramCommand());

// ---------------------------------------------------------------------------
// termviz info — print detected terminal caps and cache dir
// ---------------------------------------------------------------------------

program
    .command('info')
    .description('Show detected terminal capabilities and cache location')
    .action(() => {
        const caps = detectTerminalCaps();
        const protocolColor: Record<string, (s: string) => string> = {
            kitty: chalk.green,
            iterm2: chalk.cyan,
            sixel: chalk.yellow,
            ascii: chalk.gray,
        };
        const colorFn = protocolColor[caps.protocol] ?? chalk.white;

        console.log('');
        console.log(chalk.bold('  termviz — terminal info'));
        console.log(chalk.dim('  ─────────────────────────────────'));
        console.log(`  Protocol   ${colorFn(caps.protocol.toUpperCase())}`);
        console.log(`  Color      ${caps.colorDepth === 24 ? chalk.magenta('24-bit truecolor') : chalk.yellow('8-bit')}`);
        console.log(`  Columns    ${caps.columns}`);
        console.log(`  Rows       ${caps.rows}`);
        console.log(`  Unicode    ${caps.supportsUnicode ? chalk.green('yes') : chalk.red('no')}`);
        console.log(`  Cache dir  ${chalk.dim(CACHE_DIR)}`);
        console.log('');
    });

// ---------------------------------------------------------------------------
// Parse
// ---------------------------------------------------------------------------

program.parseAsync(process.argv).catch((err: unknown) => {
    console.error(chalk.red(`\n  ✖ ${(err as Error).message}`));
    process.exit(1);
});
