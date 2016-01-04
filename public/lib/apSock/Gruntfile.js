module.exports = function (grunt) {
    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks("grunt-contrib-uglify");

    grunt.initConfig({
        copy: {
            apSock: {
                files: [{
                    expand: false,
                    cwd: ".",
                    src: ["sockService.js"],
                    dest: "/Development/BowerComponents/apSock/dist/apSock.js"
                    }, {
                    expand: true,
                    cwd: ".",
                    src: ["apSock.min.js"],
                    dest: "/Development/BowerComponents/apSock/dist"
                    }, {
                    expand: true,
                    cwd: ".",
                    src: ["bower.json", "License.md", "README.md"],
                    dest: "/Development/BowerComponents/apSock"
                 }]
            }
        },

        uglify: {
            apSock: {
                files: {
                    "apSock.min.js": ["sockService.js"]
                }
            }
        }
    });

    grunt.registerTask("build", "Build the 'dist' files for the Lamb bower components", function() {
        grunt.task.run("uglify");
        grunt.task.run("copy");
    });
};