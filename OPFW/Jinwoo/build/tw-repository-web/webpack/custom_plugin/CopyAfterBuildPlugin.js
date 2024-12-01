const fs = require('fs');
const path = require('path');

class CopyAfterBuildPlugin {
    constructor(options) {
        this.options = options || [];
    }

    async copyDirectory(source, target) {
        const entries = await fs.promises.readdir(source, { withFileTypes: true });
        await fs.promises.mkdir(target, { recursive: true });

        for (let entry of entries) {
            const srcPath = path.join(source, entry.name);
            const destPath = path.join(target, entry.name);

            if (entry.isDirectory()) {
                await this.copyDirectory(srcPath, destPath);
            } else {
                await fs.promises.copyFile(srcPath, destPath);
            }
        }
    }

    apply(compiler) {
        compiler.hooks.afterEmit.tapAsync('CopyAfterBuildPlugin', async (compilation, callback) => {
            try {
                for (let { from, to } of this.options) {
                    const sourcePath = path.resolve(compiler.options.context, from);
                    const targetPath = path.resolve(compiler.options.context, to);
                    await this.copyDirectory(sourcePath, targetPath);
                    console.log(`Copied directory: ${sourcePath} -> ${targetPath}`);
                }
                callback();
            } catch (err) {
                console.error('CopyAfterBuildPlugin Error:', err);
                callback(err);
            }
        });
    }
}

module.exports = CopyAfterBuildPlugin;
