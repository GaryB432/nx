import {
  formatFiles,
  getProjects,
  joinPathFragments,
  logger,
  readJson,
  Tree,
} from '@nrwl/devkit';

export async function update(host: Tree) {
  const projects = getProjects(host);

  projects.forEach((project) => {
    const nextConfigPath = joinPathFragments(project.root, 'next.config.js');
    const jestConfigPath = joinPathFragments(project.root, 'jest.config.js');
    const babelConfigPath = joinPathFragments(project.root, '.babelrc');

    if (!host.exists(nextConfigPath) || !host.exists(jestConfigPath)) return;

    if (host.exists(babelConfigPath)) {
      if (customBabelConfig(host, babelConfigPath)) {
        logger.info(
          `NX Skipping SWC migration due to a custom .babelrc file. You can still delete this file yourself to enable SWC.`
        );
      } else {
        // Deleting custom babel config enables SWC
        host.delete(babelConfigPath);
      }
    }

    const content = host.read(jestConfigPath).toString();

    if (content.match(/:\s+'babel-jest'/)) {
      const updated = content.replace(
        /:\s+'babel-jest'/,
        `: ['babel-jest', { presets: ['@nrwl/next/babel'] }]`
      );
      host.write(jestConfigPath, updated);
    }
  });

  await formatFiles(host);
}

function customBabelConfig(host, configPath) {
  const json = readJson(host, configPath);
  return !(
    json.presets?.length === 1 &&
    json.presets?.[0] === '@nrwl/next/babel' &&
    (json.plugins?.length === 0 || !json.plugins)
  );
}

export default update;
