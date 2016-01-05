module.exports = function (grunt) {
    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks("grunt-contrib-uglify");

    grunt.initConfig({
        concat: {
            options: {
                separator: '\n'
            },
            apLambSocks: {
                src: ["LambSocksLib.js", "lambSocksService.js"],
                dest: "tmp/apLambSocks.js"
            }
        },

        copy: {
            apLambSocks: {
                files: [{
                        expand: true,
                        cwd: "tmp",
                        src: ["apLambSocks.js", "apLambSocks.min.js"],
                        dest: "/Development/BowerComponents/apLambSocks/dist"
                    }, {
                    expand: "true",
                    cwd: ".",
                    src: ["bower.json", "License.md", "README.md"],
                    dest: "/Development/BowerComponents/apLambSocks"
                 }]
            }
        },

        uglify: {
            apLambSocks: {
                files: {
                    "tmp/apLambSocks.min.js": ["tmp/apLambSocks.js"]
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