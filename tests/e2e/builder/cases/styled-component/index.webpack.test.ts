import path from 'path';
import { build } from '@scripts/shared';
import { webpackOnlyTest } from '@scripts/helper';
import { expect } from '@modern-js/e2e/playwright';
import { builderPluginSwc } from '@modern-js/builder-plugin-swc';

const commonConfig = {
  cwd: __dirname,
  entry: { index: path.resolve(__dirname, './src/main.ts') },
  builderConfig: {
    tools: {
      webpack: {
        externals: ['styled-components'],
      },
    },
    output: {
      disableMinimize: true,
    },
  },
};

const noStyledConfig = {
  ...commonConfig,
  builderConfig: {
    ...commonConfig.builderConfig,
    tools: {
      ...commonConfig.builderConfig.tools,
      styledComponents: false as const,
    },
  },
};

webpackOnlyTest('should allow to disable styled-components when use babel plugin', async () => {
  const builder = await build(noStyledConfig);
  const files = await builder.unwrapOutputJSON();

  const content = files[Object.keys(files).find(file => file.endsWith('.js'))!];
  expect(content).toContain('div(');
});

webpackOnlyTest('should allow to disable styled-components when use swc plugin', async () => {
  const builder = await build({
    ...noStyledConfig,
    plugins: [builderPluginSwc()],
  });
  const files = await builder.unwrapOutputJSON();

  const content = files[Object.keys(files).find(file => file.endsWith('.js'))!];

  expect(content).toContain('div(');
});

webpackOnlyTest('should transform styled-components by default when use babel plugin', async () => {
  const builder = await build(commonConfig);
  const files = await builder.unwrapOutputJSON();

  const content = files[Object.keys(files).find(file => file.endsWith('.js'))!];

  expect(content).toContain('div.withConfig');
});

webpackOnlyTest('should transform styled-components by default when use swc plugin', async () => {
  const builder = await build({
    ...commonConfig,
    plugins: [builderPluginSwc()],
  });
  const files = await builder.unwrapOutputJSON();

  const content = files[Object.keys(files).find(file => file.endsWith('.js'))!];

  expect(content).toContain('div.withConfig');
});
