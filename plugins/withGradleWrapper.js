const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// Bumps the Gradle wrapper to 8.13, required by AGP in React Native 0.81+
module.exports = function withGradleWrapper(config) {
  return withDangerousMod(config, [
    'android',
    (config) => {
      const wrapperPropsPath = path.join(
        config.modRequest.platformProjectRoot,
        'gradle/wrapper/gradle-wrapper.properties'
      );
      if (fs.existsSync(wrapperPropsPath)) {
        let contents = fs.readFileSync(wrapperPropsPath, 'utf8');
        contents = contents.replace(
          /distributionUrl=.*/,
          'distributionUrl=https\\://services.gradle.org/distributions/gradle-8.13-bin.zip'
        );
        fs.writeFileSync(wrapperPropsPath, contents);
      }
      return config;
    },
  ]);
};
