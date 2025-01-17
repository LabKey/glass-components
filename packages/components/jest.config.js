// Run all tests with timezone set to UTC
// https://stackoverflow.com/a/56482581
process.env.TZ = 'UTC';

module.exports = {
    globals: {
        LABKEY: {
            contextPath: '/labkey',
            container: {
                path: '',
                formats: {
                    dateFormat: "yyyy-MM-dd",
                    dateTimeFormat: "yyyy-MM-dd HH:mm",
                    timeFormat: "HH:mm"
                }
            },
            project: {
                rootId: 'ROOTID'
            },
            user: {
                id: 1004
            },
            helpLinkPrefix: 'https://www.labkey.org/Documentation/wiki-page.view?name=',
            moduleContext: {
                study: {
                    subject: {
                        nounPlural: 'Participants',
                        tableName: 'Participant',
                        nounSingular: 'Participant',
                        columnName: 'ParticipantId'
                    },
                    timepointType: 'VISIT'
                }
            }
        },
    },
    moduleFileExtensions: ['ts', 'tsx', 'js'],
    roots: ['<rootDir>'],
    setupFilesAfterEnv: [
        './src/test/jest.setup.ts'
    ],
    testEnvironment: 'jsdom',
    testPathIgnorePatterns: [
        '/node_modules/'
    ],
    testRegex: '(\\.(test))\\.(ts|tsx)$',
    testResultsProcessor: 'jest-teamcity-reporter',
    transform: {
        '^.+\\.tsx?$': [
            'ts-jest',
            {
                // This increases test perf by a considerable margin
                isolatedModules: true,
            }
        ],
    },
};
