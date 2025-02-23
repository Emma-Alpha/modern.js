import { join, resolve } from 'path';
import { expect, test } from '@modern-js/e2e/playwright';
import { build, getHrefByEntryName } from '@scripts/shared';

const fixtures = resolve(__dirname, '../');

test('rem default (disable)', async ({ page }) => {
  const builder = await build({
    cwd: fixtures,
    entry: {
      main: join(fixtures, 'src/index.ts'),
    },
    runServer: true,
  });
  await page.goto(getHrefByEntryName('main', builder.port));

  await expect(
    page.evaluate(
      `window.getComputedStyle(document.getElementById('title')).fontSize`,
    ),
  ).resolves.toBe('20px');

  await expect(
    page.evaluate(
      `window.getComputedStyle(document.getElementById('description')).fontSize`,
    ),
  ).resolves.toBe('16px');

  builder.close();
});

test('rem enable', async ({ page }) => {
  // convert to rem
  const builder = await build({
    cwd: fixtures,
    entry: {
      main: join(fixtures, 'src/index.ts'),
    },
    runServer: true,
    builderConfig: {
      output: {
        convertToRem: true,
      },
    },
  });

  await page.goto(getHrefByEntryName('main', builder.port));

  await expect(
    page.evaluate('document.documentElement.style.fontSize'),
  ).resolves.toBe('64px');

  // less convert pxToRem
  await expect(
    page.evaluate(
      `window.getComputedStyle(document.getElementById('title')).fontSize`,
    ),
  ).resolves.toBe('25.6px');

  // scss convert pxToRem
  await expect(
    page.evaluate(
      `window.getComputedStyle(document.getElementById('header')).fontSize`,
    ),
  ).resolves.toBe('25.6px');

  // css convert pxToRem
  await expect(
    page.evaluate(
      `window.getComputedStyle(document.getElementById('description')).fontSize`,
    ),
  ).resolves.toBe('20.48px');

  builder.close();
});

test('should inline runtime code to html by default', async () => {
  const builder = await build({
    cwd: fixtures,
    entry: { index: join(fixtures, 'src/index.ts') },
    builderConfig: {
      output: {
        convertToRem: {},
      },
    },
  });
  const files = await builder.unwrapOutputJSON();
  const htmlFile = Object.keys(files).find(file => file.endsWith('.html'));

  expect(htmlFile).toBeTruthy();
  expect(files[htmlFile!].includes('function setRootPixel')).toBeTruthy();
});

test('should extract runtime code when inlineRuntime is false', async () => {
  const builder = await build({
    cwd: fixtures,
    entry: { index: join(fixtures, 'src/index.ts') },
    builderConfig: {
      output: {
        convertToRem: {
          inlineRuntime: false,
        },
      },
    },
  });
  const files = await builder.unwrapOutputJSON();

  const htmlFile = Object.keys(files).find(file => file.endsWith('.html'));
  const retryFile = Object.keys(files).find(
    file => file.includes('/convert-rem') && file.endsWith('.js'),
  );

  expect(htmlFile).toBeTruthy();
  expect(retryFile).toBeTruthy();
  expect(files[htmlFile!].includes('function setRootPixel')).toBeFalsy();
});
