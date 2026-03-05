import { Command } from 'commander';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { resolve, extname } from 'path';
import { runPipeline } from '@termviz/core';
import { renderVisualArtifact } from '../render/visualArtifact.js';
import chalk from 'chalk';
import ora from 'ora';
import type { Theme, TerminalProtocol } from '@termviz/core';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function extractMermaidFromFile(filePath: string): Promise<string> {
    const content = await readFile(filePath, 'utf-8');
    const ext = extname(filePath).toLowerCase();

    if (ext === '.mmd' || ext === '.mermaid') {
        return content.trim();
    }

    // Extract ```mermaid blocks from Markdown
    if (ext === '.md' || ext === '.mdx') {
        const match = content.match(/```mermaid\n([\s\S]*?)```/);
        if (match?.[1]) {
            return match[1].trim();
        }
        throw new Error('No ```mermaid code block found in Markdown file.');
    }

    // Try treating it as raw Mermaid anyway
    return content.trim();
}

// ---------------------------------------------------------------------------
// Command definition
// ---------------------------------------------------------------------------

export function createDiagramCommand(): Command {
    const cmd = new Command('diagram');

    cmd
        .description('Render a Mermaid diagram inline in your terminal')
        .option('-f, --spec-file <path>', 'Path to .mmd or .md file containing Mermaid source')
        .option('-s, --spec <text>', 'Inline Mermaid source (alternative to --spec-file)')
        .option(
            '-t, --theme <theme>',
            'Diagram theme: default | dark | neutral (default: dark)',
            'dark',
        )
        .option('-w, --width <px>', 'Render width in pixels (default: 1200)', '1200')
        .option(
            '-p, --protocol <proto>',
            'Force terminal protocol: kitty | iterm2 | sixel | ascii',
        )
        .option('--no-cache', 'Skip cache and re-render')
        .action(async (opts: {
            specFile?: string;
            spec?: string;
            theme: string;
            width: string;
            protocol?: string;
            cache: boolean;
        }) => {
            // --- Validate ---
            if (!opts.specFile && !opts.spec) {
                console.error(chalk.red('  ✖ Either --spec-file or --spec is required.'));
                process.exit(1);
            }

            const theme = (['default', 'dark', 'neutral'].includes(opts.theme)
                ? opts.theme
                : 'dark') as Theme;
            const widthPx = parseInt(opts.width, 10) || 1200;
            const forceProtocol = opts.protocol as TerminalProtocol | undefined;

            // Determine effective protocol early — if ASCII, we skip Puppeteer entirely
            const { detectTerminalCaps } = await import('../caps/detect.js');
            const caps = detectTerminalCaps();
            const effectiveProtocol = forceProtocol ?? caps.protocol;
            const asciiOnly = effectiveProtocol === 'ascii';

            // --- Read spec ---
            let spec = '';
            try {
                if (opts.specFile) {
                    const filePath = resolve(process.cwd(), opts.specFile);
                    if (!existsSync(filePath)) {
                        console.error(chalk.red(`  ✖ File not found: ${filePath}`));
                        process.exit(1);
                    }
                    spec = await extractMermaidFromFile(filePath);
                } else {
                    spec = opts.spec!;
                }
            } catch (err) {
                console.error(chalk.red(`  ✖ Failed to read spec: ${(err as Error).message}`));
                process.exit(1);
            }

            // --- Render pipeline ---
            const spinner = ora({ text: 'Rendering diagram…', stream: process.stderr }).start();

            try {
                const result = await runPipeline({
                    spec,
                    diagramType: 'mermaid',
                    theme,
                    widthPx,
                    asciiOnly,
                });

                spinner.stop();
                process.stderr.write('\n');

                await renderVisualArtifact(result, {
                    spec,
                    forceProtocol: effectiveProtocol,
                    showMeta: true,
                });

                process.stderr.write('\n');
            } catch (err) {
                spinner.stop();
                console.error(chalk.red(`\n  ✖ Render failed: ${(err as Error).message}`));
                process.exit(1);
            }
        });

    return cmd;
}
