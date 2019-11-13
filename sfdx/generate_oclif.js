#!/usr/bin/env node

// Dependencies
var fs = require('fs'),
    path = require('path'),
    SDK = require('../shared/constants'),
    configHelper = require('../shared/configHelper');

function generateOclifManifest() {
    var commands = {};
    for (var cliName in SDK.forceclis) {
        var cli = SDK.forceclis[cliName];
        cli.commands.map(commandName => {
            var command = configHelper.getCommandExpanded(cli, commandName);
            var key = `mobilesdk:${cli.topic}:${command.name}`;

            // Computing flags
            var flags = {}
            command.args.map(arg => {
                flag = {
                    name: arg.name,
                    type: arg.type,
                    'char': arg['char'],
                    description: arg.description,
                    required: !!arg.required,
                    hidden: !!arg.hidden
                };

                if (arg.hidden) flag.hidden = true;
                flags[arg.name] = flag
            })

            // Computing command
            commands[key] = {
                id: key,
                description: command.description + '\n\n' + command.help,
                pluginName: 'sfdx-mobilesdk-plugin',
                pluginType: 'core',
                aliases: [],
                flags: flags,
                args: []
            }
        })
    }

    // Computing manifest
    var manifest = {
        versin: SDK.version,
        commands: commands
    };

    fs.writeFileSync(path.resolve('oclif.manifest.json'), JSON.stringify(manifest, null, 2))
}

function generateCommandFiles() {

    for (var cliName in SDK.forceclis) {
        var cli = SDK.forceclis[cliName];
        var dirPath = path.resolve('oclif', 'mobilesdk', cli.topic);
        fs.mkdirSync(dirPath, true);
        cli.commands.map(commandName => {
            generateCommmandClass(cli, commandName);
        })
    }
}

function generateCommmandClass(cli, commandName) {
    var className = capitalize(cli.topic) + capitalize(commandName) + 'Command';
    var classPath = path.resolve('oclif', 'mobilesdk', cli.topic, commandName + '.new.js');
    var classContent = [
        `/*`,
        ` * Copyright (c) 2019-present, salesforce.com, inc.`,
        ` * All rights reserved.`,
        ` * Redistribution and use of this software in source and binary forms, with or`,
        ` * without modification, are permitted provided that the following conditions`,
        ` * are met:`,
        ` * - Redistributions of source code must retain the above copyright notice, this`,
        ` * list of conditions and the following disclaimer.`,
        ` * - Redistributions in binary form must reproduce the above copyright notice,`,
        ` * this list of conditions and the following disclaimer in the documentation`,
        ` * and/or other materials provided with the distribution.`,
        ` * - Neither the name of salesforce.com, inc. nor the names of its contributors`,
        ` * may be used to endorse or promote products derived from this software without`,
        ` * specific prior written permission of salesforce.com, inc.`,
        ` * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"`,
        ` * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE`,
        ` * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE`,
        ` * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE`,
        ` * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR`,
        ` * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF`,
        ` * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS`,
        ` * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN`,
        ` * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)`,
        ` * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE`,
        ` * POSSIBILITY OF SUCH DAMAGE.`,
        ` */`,
        `const path = require('path');`,
        ``,
        `const OclifAdapter = require('../../../shared/oclifAdapter');`,
        `const SDK = require('../../../shared/constants');`,
        ,
        `class ${className} extends OclifAdapter {`,
        `    static get command() {`,
        `        return OclifAdapter.getCommand.call(this, SDK.forceclis.${cli.name}, path.parse(__filename).name);`,
        `    }`,
        ``,
        `    async run() {`,
        `        this.execute(SDK.forceclis.forcedroid, ${className});`,
        `    }`,
        `}`,
        ``,
        `${className}.description = OclifAdapter.formatDescription(${className}.command.description,`,
        `    ${className}.command.help);`,
        ``,
        `${className}.longDescription = ${className}.command.longDescription;`,
        `${className}.hidden = ${className}.command.hidden;`,
        `${className}.flags = OclifAdapter.toFlags(${className}.command.args);`,
        ``,
        `exports.${className} = ${className};`,
        ``,
        `}`
    ].join('\n');
    fs.writeFileSync(classPath, classContent);
}

function capitalize(s) {
    return s.charAt(0).toUpperCase() + name.slice(1);
}

// Main
generateOclifManifest();
