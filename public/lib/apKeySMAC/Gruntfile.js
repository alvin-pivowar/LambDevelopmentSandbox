module.exports = function (grunt) {
    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks("grunt-contrib-uglify");

    grunt.initConfig({
        concat: {
            options: {
                separator: '\n'
            },
            smac: {
                src: ["apKeySmac.js", "keySmacService.js", "keySmacLegendService.js"],
                dest: "tmp/apKeySMAC.js"
            }
        },

        copy: {
            lamb: {
                files: [{
                        expand: true,
                        cwd: "tmp",
                        src: ["apKeySMAC.js", "apKeySMAC.min.js"],
                        dest: "/Development/BowerComponents/apKeySMAC/dist"
                    }
                ]
            }
        },

        uglify: {
            lamb: {
                files: {
                    "tmp/apKeySMAC.min.js": ["tmp/apKeySMAC.js"]
                }
            }
        }
    });

    grunt.registerTask("build", "Build the 'dist' files for the Lamb bower components", function() {
        grunt.task.run("clean:begin");
        grunt.task.run("concat");
        grunt.task.run("uglify");
        grunt.task.run("copy");
        grunt.task.run("clean:end");
    });


    grunt.registerTask("clean", "Manage the temp directory", function (phase) {
        if (grunt.file.isDir("tmp"))
            grunt.file.delete("tmp");

        if (phase === "begin")
            grunt.file.mkdir("tmp");
    });
};