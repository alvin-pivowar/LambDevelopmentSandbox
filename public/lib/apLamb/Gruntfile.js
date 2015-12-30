module.exports = function (grunt) {
    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks("grunt-contrib-uglify");

    grunt.initConfig({
        concat: {
            options: {
                separator: '\n'
            },
            lamb: {
                src: ["LambLib.js", "lambService.js"],
                dest: "tmp/apLamb.js"
            }
        },

        copy: {
            lamb: {
                files: [{
                        expand: true,
                        cwd: "tmp",
                        src: ["apLamb.js", "apLamb.min.js"],
                        dest: "/Development/BowerComponents/apLamb/dist"
                    }, {
                        expand: "true",
                        cwd: ".",
                        src: ["bower.json"],
                        dest: "/Development/BowerComponents/apLamb"
                    }, {
                    expand: "true",
                    cwd: ".",
                    src: ["License.md", "README.md"],
                    dest: "/Development/BowerComponents/apLamb/dist"
                 }]
            }
        },

        uglify: {
            lamb: {
                files: {
                    "tmp/apLamb.min.js": ["tmp/apLamb.js"]
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