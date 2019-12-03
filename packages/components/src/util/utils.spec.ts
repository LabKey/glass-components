/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { fromJS, List, Map } from 'immutable';

import { SchemaQuery, User } from '../components/base/models/model';
import {
    caseInsensitive,
    contains,
    getCommonDataValues,
    getSchemaQuery,
    getUpdatedData,
    getUpdatedDataFromGrid,
    hasAllPermissions,
    hasPrefix,
    intersect,
    naturalSort,
    resolveKey,
    resolveKeyFromJson,
    resolveSchemaQuery,
    similaritySortFactory,
    toLowerSafe,
    unorderedEqual,
} from './utils';
import { PermissionTypes } from '../components/base/models/constants';

const emptyList = List<string>();

describe('resolveKey', () => {
    test("no encodings", () => {
        expect(resolveKey("schema", "query")).toBe("schema/query");
        expect(resolveKey("Schema", "Query")).toBe("schema/query");
        expect(resolveKey("ScheMa", "QueRy")).toBe("schema/query");
    });

    test("with encodings", () => {
        expect(resolveKey("$chem&", "{query,/.more~less}")).toBe("$dchem$a/{query$c$s$pmore$tless$b");
        expect(resolveKey("$,hema$", "q&x&&&d")).toBe("$d$chema$d/q$ax$a$a$ad");
    });
});

describe("resolveKeyFromJson", () => {
    test("schema name with one part", () => {
        expect(resolveKeyFromJson({schemaName: ["partOne"], queryName: "q/Name"})).toBe("partone/q$sname");
        expect(resolveKeyFromJson({schemaName: ["p&rtOne"], queryName: "//$Name"})).toBe("p$artone/$s$s$dname");
    });

    test("schema name with multiple parts", () => {
        expect(resolveKeyFromJson({schemaName: ["one", "Two", "thrEE$"], queryName: "four"})).toBe("one$ptwo$pthree$d/four")
    });
});

describe("resolveSchemaQuery", () => {
    test("handle undefined schemaQuery", () => {
        expect(resolveSchemaQuery(undefined)).toBeNull()
    });

    test("schema without encoding required", () => {
        const schemaQuery = new SchemaQuery({
            schemaName: "name",
            queryName: "my favorite query"
        });
        expect(resolveSchemaQuery(schemaQuery)).toBe("name/my favorite query")
    });
});

describe("getSchemaQuery", () => {
   test("no decoding required", () => {
       const expected = new SchemaQuery({
           schemaName: "name",
           queryName: "query"
       });
       expect(getSchemaQuery("name/query")).toEqual(expected);
   });

   test("decoding required", () => {
       expect(getSchemaQuery("my$Sname/just$pask")).toEqual(new SchemaQuery( {
           schemaName: "my/name",
           queryName: "just.ask"
       }));
       expect(getSchemaQuery("one$ptwo$pthree$d/q1")).toEqual(new SchemaQuery({
           schemaName: "one.two.three$",
           queryName: "q1"
       }));
   });
});

describe("naturalSort", () => {
    test("alphabetic", () => {
        expect(naturalSort("", "anything")).toBe(1);
        expect(naturalSort("anything", "")).toBe(-1);
        expect(naturalSort(undefined, "anything")).toBe(1);
        expect(naturalSort("a", "a")).toBe(0);
        expect(naturalSort("alpha", "aLPha")).toBe(0);
        expect(naturalSort(" ", "anything")).toBe(-1);
        expect(naturalSort("a", "b")).toBe(-1);
        expect(naturalSort("A", "b")).toBe(-1);
        expect(naturalSort("A", "Z")).toBe(-1);
        expect(naturalSort("alpha", "zeta")).toBe(-1);
        expect(naturalSort("zeta", "atez")).toBe(1);
        expect(naturalSort("Zeta", "Atez")).toBe(1);
    });

    test("alphanumeric", () => {
        expect(naturalSort("a1.2", "a1.3")).toBeLessThan(0);
        expect(naturalSort("1.431", "14.31")).toBeLessThan(0);
        expect(naturalSort("10", "1.0")).toBeGreaterThan(0);
        expect(naturalSort("1.2ABC", "1.2XY")).toBeLessThan(0);
    });
});

describe("intersect", () => {
    test("with matches", () => {
        expect(intersect(List<string>(["a", "b", "abc"]), List<string>(["A", "Z", "aBC"])))
            .toEqual(List<string>(['a', 'abc']));
        expect(intersect(List(["fun", "times"]), List(["funny", "times"])))
            .toEqual(List(['times']));
    });

    test("without matches", () => {
        expect(intersect(List<string>(["one", "two"]), List(["sun", "moon"])))
            .toEqual(emptyList);
        expect(intersect(emptyList, List(["fun", "times"])))
            .toEqual(emptyList);
        expect(intersect(List(["fun", "times"]), emptyList))
            .toEqual(emptyList);
    });
});

describe("toLowerSafe", () => {
    test("strings", () => {
        expect(toLowerSafe(List<string>(['TEST ', ' Test', 'TeSt', 'test'])))
            .toEqual(List<string>(['test ', ' test', 'test', 'test']));
    });

    test("numbers", () => {
        expect(toLowerSafe(List<string>([1,2,3])))
            .toEqual(emptyList);
        expect(toLowerSafe(List<string>([1.0])))
            .toEqual(emptyList);
        expect(toLowerSafe(List<string>([1.0, 2])))
            .toEqual(emptyList);
    });

    test("strings and numbers", () => {
        expect(toLowerSafe(List<string>([1, 2, 'TEST ', ' Test', 3.0, 4.4, 'TeSt', 'test'])))
            .toEqual(List<string>(['test ', ' test', 'test', 'test']));
    });
});

describe("hasAllPermissions", () => {
    test("user without permission", () => {
        expect(hasAllPermissions(new User(), [PermissionTypes.Insert])).toBe(false);
    });


    test("user has some but not all permissions", () => {
        expect(hasAllPermissions(new User({
            permissionsList: [PermissionTypes.Read]
        }), [PermissionTypes.Insert, PermissionTypes.Read])).toBe(false);
    });

    test("user has only required permission", () => {
        expect(hasAllPermissions(new User({
            permissionsList: [PermissionTypes.Insert]
        }), [PermissionTypes.Insert])).toBe(true);
    });

    test("user has more permission", () => {
        expect(hasAllPermissions(new User({
            permissionsList: [PermissionTypes.Insert, PermissionTypes.Delete, PermissionTypes.Read]
        }), [PermissionTypes.Insert])).toBe(true);
    });


    test("user permissions do not intersect", () => {
        expect(hasAllPermissions(new User({
            permissionsList: [PermissionTypes.Delete, PermissionTypes.Read]
        }), [PermissionTypes.Insert])).toBe(false);

    });
});

describe("unorderedEqual", () => {
    test("empty arrays", () => {
        expect(unorderedEqual([], [])).toBe(true);
    });

    test("different size arrays", () => {
        expect(unorderedEqual(["a"], ["b", "a"])).toBe(false);
    });

    test("same size but differnet elements", () => {
        expect(unorderedEqual(["a", "b"], ["b", "c"])).toBe(false);
    });

    test("elements in different order", () => {
        expect(unorderedEqual(["a", "b", "c", "d"], ["d", "c", "a", "b"])).toBe(true);
    });

    test("equal arrays, same order", () => {
        expect(unorderedEqual(["a", "b", "c", "d"], ["a", "b", "c", "d"])).toBe(true);
    })
});

describe("getCommonDataForSelection", () => {
    test("nothing common", () => {

        const data = fromJS({
            "1": {
                "field1": {
                    value: "value1"
                },
                "field2": {
                    value: "value2"
                }
            },
            "2": {
                "field1": {
                    value: "value3"
                },
                "field2": {
                    value: "value4"
                },
            }
        });
        expect(getCommonDataValues(data)).toEqual({});
    });

    test("undefined and missing values", () => {

        const data = fromJS({
            "1": {
                "field1": {
                    "value": undefined
                },
                "field2": {
                    "value": "value2"
                },
                "field3": {
                    "value": "value3"
                },
                "field4": {
                    "value": "same"
                }
            },
            "2": {
                "field1": {
                    value: "value1"
                },
                "field2": {
                    "value": "value2b"
                },
                "field3": {
                    value: null
                },
                "field4": {
                    "value": "same"
                }
            }
        });
        expect(getCommonDataValues(data)).toEqual({
            "field4": "same"
        });
    });

    test("same common values", () => {
        const data = fromJS({
            "448": {
                "RowId" : {
                    "value" : 448,
                    "url" : "/labkey/Sample%20Management/experiment-showMaterial.view?rowId=448"
                },
                "Value" : {
                    "value" : null
                },
                "Data" : {
                    "value" : "data1"
                },
                "AndAgain" : {
                    "value" : "again"
                },
                "Name" : {
                    "value" : "S-20190516-9042",
                    "url" : "/labkey/Sample%20Management/experiment-showMaterial.view?rowId=448"
                },
                "Other" : {
                    "value" : "other1"
                }
            },
            "447": {
                "RowId" : {
                    "value" : 447,
                    "url" : "/labkey/Sample%20Management/experiment-showMaterial.view?rowId=447"
                },
                "Value" : {
                    "value" : null
                },
                "Data" : {
                    "value" : "data1"
                },
                "AndAgain" : {
                    "value" : "again"
                },
                "Name" : {
                    "value" : "S-20190516-4622",
                    "url" : "/labkey/Sample%20Management/experiment-showMaterial.view?rowId=447"
                },
                "Other" : {
                    "value" : "other2"
                }
            },
            "446": {
                "RowId" : {
                    "value" : 446,
                    "url" : "/labkey/Sample%20Management/experiment-showMaterial.view?rowId=446"
                },
                "Value" : {
                    "value" : "val"
                },
                "Data" : {
                    "value" : "data1"
                },
                "AndAgain" : {
                    "value" : "again"
                },
                "Name" : {
                    "value" : "S-20190516-2368",
                    "url" : "/labkey/Sample%20Management/experiment-showMaterial.view?rowId=446"
                },
                "Other" : {
                    "value" : "other3"
                }
            },
            "445":{
                "RowId" : {
                    "value" : 445,
                    "url" : "/labkey/Sample%20Management/experiment-showMaterial.view?rowId=445"
                },
                "Value" : {
                    "value" : "val"
                },
                "Data" : {
                    "value" : "data1"
                },
                "AndAgain" : {
                    "value" : "again"
                },
                "Name" : {
                    "value" : "S-20190516-9512",
                    "url" : "/labkey/Sample%20Management/experiment-showMaterial.view?rowId=445"
                },
                "Other" : {
                    "value" : null
                }
            },
            "367": {
                "RowId" : {
                    "value" : 367,
                    "url" : "/labkey/Sample%20Management/experiment-showMaterial.view?rowId=367"
                },
                "Value" : {
                    "value" : null
                },
                "Data" : {
                    "value" : "data1"
                },
                "AndAgain" : {
                    "value" : "again"
                },
                "Name" : {
                    "value" : "S-20190508-5534",
                    "url" : "/labkey/Sample%20Management/experiment-showMaterial.view?rowId=367"
                },
                "Other" : {
                    "value" : null
                }
            }
        });
        expect(getCommonDataValues(data)).toEqual({
            "AndAgain": "again",
            "Data": "data1"
        });
    });
});

describe("getUpdatedData", () => {
    const originalData = fromJS({
        "448": {
            "RowId": {
                "value": 448,
                "url": "/labkey/Sample%20Management/experiment-showMaterial.view?rowId=448"
            },
            "Value": {
                "value": null
            },
            "Data": {
                "value": "data1"
            },
            "AndAgain": {
                "value": "again"
            },
            "Name": {
                "value": "S-20190516-9042",
                "url": "/labkey/Sample%20Management/experiment-showMaterial.view?rowId=448"
            },
            "Other": {
                "value": "other1"
            }
        },
        "447": {
            "RowId": {
                "value": 447,
                "url": "/labkey/Sample%20Management/experiment-showMaterial.view?rowId=447"
            },
            "Value": {
                "value": null
            },
            "Data": {
                "value": "data1"
            },
            "AndAgain": {
                "value": "again"
            },
            "Name": {
                "value": "S-20190516-4622",
                "url": "/labkey/Sample%20Management/experiment-showMaterial.view?rowId=447"
            },
            "Other": {
                "value": "other2"
            }
        },
        "446": {
            "RowId": {
                "value": 446,
                "url": "/labkey/Sample%20Management/experiment-showMaterial.view?rowId=446"
            },
            "Value": {
                "value": "val"
            },
            "Data": {
                "value": "data1"
            },
            "AndAgain": {
                "value": "again"
            },
            "Name": {
                "value": "S-20190516-2368",
                "url": "/labkey/Sample%20Management/experiment-showMaterial.view?rowId=446"
            },
            "Other": {
                "value": "other3"
            }
        },
        "445": {
            "RowId": {
                "value": 445,
                "url": "/labkey/Sample%20Management/experiment-showMaterial.view?rowId=445"
            },
            "Value": {
                "value": "val"
            },
            "Data": {
                "value": "data1"
            },
            "AndAgain": {
                "value": "again"
            },
            "Name": {
                "value": "S-20190516-9512",
                "url": "/labkey/Sample%20Management/experiment-showMaterial.view?rowId=445"
            },
            "Other": {
                "value": null
            }
        },
    });

    test("empty updates", () => {
        const updatedData = getUpdatedData(originalData, {
        }, List<string>(["RowId"]));
        expect(updatedData).toHaveLength(0);
    });

    test("updated values did not change", () => {
        const updatedData = getUpdatedData(originalData, {
            "Data": "data1",
            "AndAgain": "again"
        }, List<string>(["RowId"]));
        expect(updatedData).toHaveLength(0);
    });

    test("changed values for some", () => {
        const updatedData = getUpdatedData(originalData, {
            "Value": "val",
            "Data": "data1",
            "AndAgain": "again",
            "Other": "other3"
        }, List<string>(["RowId"]));
        expect(updatedData).toHaveLength(3);
        expect(updatedData[0]).toStrictEqual({
            "RowId": 445,
            "Other": "other3"
        });
        expect(updatedData[1]).toStrictEqual({
            "RowId": 447,
            "Value": "val",
            "Other": "other3"
        });
        expect(updatedData[2]).toStrictEqual({
            "RowId": 448,
            "Value": "val",
            "Other": "other3"
        });
    });

    test("changed values for all", () => {
        const updatedData = getUpdatedData(originalData, {
            "Value": "val2",
            "Data": "data2",
            "AndAgain": "again2",
            "Other": "not another"
        }, List<string>(["RowId"]));
        expect(updatedData).toHaveLength(4);
        expect(updatedData[0]).toStrictEqual({
            "RowId": 445,
            "Value": "val2",
            "Data": "data2",
            "AndAgain": "again2",
            "Other": "not another"
        });
        expect(updatedData[1]).toStrictEqual({
            "RowId": 446,
            "Value": "val2",
            "Data": "data2",
            "AndAgain": "again2",
            "Other": "not another"
        });
        expect(updatedData[2]).toStrictEqual({
            "RowId": 447,
            "Value": "val2",
            "Data": "data2",
            "AndAgain": "again2",
            "Other": "not another"
        });
        expect(updatedData[3]).toStrictEqual({
            "RowId": 448,
            "Value": "val2",
            "Data": "data2",
            "AndAgain": "again2",
            "Other": "not another"
        });
    });

    test("removed values", () => {
        const updatedData = getUpdatedData(originalData, {
            "Value": null,
            "AndAgain": undefined,
            "Other": "not another"
        }, List<string>(["RowId"]));
        expect(updatedData).toHaveLength(4);
        expect(updatedData[0]).toStrictEqual({
            "RowId": 445,
            "Value": null,
            "AndAgain": undefined,
            "Other": "not another"
        });
        expect(updatedData[1]).toStrictEqual({
            "RowId": 446,
            "Value": null,
            "AndAgain": undefined,
            "Other": "not another"
        });
        expect(updatedData[2]).toStrictEqual({
            "RowId": 447,
            "AndAgain": undefined,
            "Other": "not another"
        });
        expect(updatedData[3]).toStrictEqual({
            "RowId": 448,
            "AndAgain": undefined,
            "Other": "not another"
        });
    });
});

describe("getUpdatedDataFromGrid", () => {
    // const originalData = fromJS({
    //     "448": {
    //         "RowId": {
    //             "value": 448,
    //             "url": "/labkey/Sample%20Management/experiment-showMaterial.view?rowId=448"
    //         },
    //         "Value": {
    //             "value": null
    //         },
    //         "Data": {
    //             "value": "data1"
    //         },
    //         "AndAgain": {
    //             "value": "again"
    //         },
    //         "Name": {
    //             "value": "S-20190516-9042",
    //             "url": "/labkey/Sample%20Management/experiment-showMaterial.view?rowId=448"
    //         },
    //         "Other": {
    //             "value": "other1"
    //         }
    //     },
    //     "447": {
    //         "RowId": {
    //             "value": 447,
    //             "url": "/labkey/Sample%20Management/experiment-showMaterial.view?rowId=447"
    //         },
    //         "Value": {
    //             "value": null
    //         },
    //         "Data": {
    //             "value": "data1"
    //         },
    //         "AndAgain": {
    //             "value": "again"
    //         },
    //         "Name": {
    //             "value": "S-20190516-4622",
    //             "url": "/labkey/Sample%20Management/experiment-showMaterial.view?rowId=447"
    //         },
    //         "Other": {
    //             "value": "other2"
    //         }
    //     },
    //     "446": {
    //         "RowId": {
    //             "value": 446,
    //             "url": "/labkey/Sample%20Management/experiment-showMaterial.view?rowId=446"
    //         },
    //         "Value": {
    //             "value": "val"
    //         },
    //         "Data": {
    //             "value": "data1"
    //         },
    //         "AndAgain": {
    //             "value": "again"
    //         },
    //         "Name": {
    //             "value": "S-20190516-2368",
    //             "url": "/labkey/Sample%20Management/experiment-showMaterial.view?rowId=446"
    //         },
    //         "Other": {
    //             "value": "other3"
    //         }
    //     },
    //     "445": {
    //         "RowId": {
    //             "value": 445,
    //             "url": "/labkey/Sample%20Management/experiment-showMaterial.view?rowId=445"
    //         },
    //         "Value": {
    //             "value": "val"
    //         },
    //         "Data": {
    //             "value": "data1"
    //         },
    //         "AndAgain": {
    //             "value": "again"
    //         },
    //         "Name": {
    //             "value": "S-20190516-9512",
    //             "url": "/labkey/Sample%20Management/experiment-showMaterial.view?rowId=445"
    //         },
    //         "Other": {
    //             "value": null
    //         }
    //     },
    // });
    const originalData = fromJS({
        448: {
            "RowId":  448,
            "Value": null,
            "Data": "data1",
            "AndAgain":  "again",
            "Name":  "S-20190516-9042",
            "Other": "other1"
        },
        447: {
            "RowId":  447,
            "Value":  null,
            "Data":  "data1",
            "AndAgain": "again",
            "Name": "S-20190516-4622",
            "Other": "other2"
        },
        446: {
            "RowId":  446,
            "Value":  "val",
            "Data":  "data1",
            "AndAgain": "again",
            "Name": "S-20190516-2368",
            "Other":  "other3"
        },
        445: {
            "RowId":  445,
            "Value": "val",
            "Data": "data1",
            "AndAgain":  "again",
            "Name":  "S-20190516-9512",
            "Other": null
        },
    });
    test("no edited rows", () => {
        const updatedData = getUpdatedDataFromGrid(originalData, [], "RowId");
        expect(updatedData).toHaveLength(0);
    });

    test("edited rows did not change", () => {
        const updatedData = (getUpdatedDataFromGrid(originalData, [
            Map<string, any>({
                "RowId":  "448",
                "Value": null,
                "Data": "data1",
                "AndAgain":  "again",
                "Name":  "S-20190516-9042",
                "Other": "other1"
            }),
            Map<string, any>({
                "RowId":  "447",
                "Value":  null,
                "Data":  "data1",
                "AndAgain": "again",
                "Name": "S-20190516-4622",
                "Other": "other2"
            }),
            Map<string, any>({
                "RowId":  "446",
                "Value":  "val",
                "Data":  "data1",
                "AndAgain": "again",
                "Name": "S-20190516-2368",
                "Other":  "other3"
            }),
            Map<string, any>({
                "RowId":  "445",
                "Value": "val",
                "Data": "data1",
                "AndAgain":  "again",
                "Name":  "S-20190516-9512",
                "Other": null
            })

        ], "RowId"));
        expect(updatedData).toHaveLength(0);
    });

    test("edited row removed values", () => {
        const updatedData = (getUpdatedDataFromGrid(originalData, [
            Map<string, any>({
                "RowId":  "448",
                "Value": null,
                "Data": undefined,
                "AndAgain":  "again",
                "Name":  "S-20190516-9042",
                "Other": "other1"
            }),
            Map<string, any>({
                "RowId":  "447",
                "Value":  null,
                "Data":  "data1",
                "AndAgain": null,
                "Name": "S-20190516-4622",
                "Other": "other2"
            }),
            Map<string, any>({
                "RowId":  "446",
                "Value":  "val",
                "Data":  "data1",
                "AndAgain": "again",
                "Name": "S-20190516-2368",
                "Other":  "other3"
            }),
            Map<string, any>({
                "RowId":  "445",
                "Value": "val",
                "Data": "data1",
                "AndAgain":  "again",
                "Name":  "S-20190516-9512",
                "Other": null
            })

        ], "RowId"));
        expect(updatedData).toHaveLength(2);
        expect(updatedData[0]).toStrictEqual( {
            "Data": null,
            "RowId": "448"
        });
        expect(updatedData[1]).toStrictEqual( {
            "AndAgain": null,
            "RowId": "447"
        })
    });

    test("edited row changed some values", () => {
        const updatedData = (getUpdatedDataFromGrid(originalData, [
            Map<string, any>({
                "RowId":  "448",
                "Value": null,
                "Data": undefined,
                "AndAgain":  "again",
                "Name":  "S-20190516-9042",
                "Other": "other1"
            }),
            Map<string, any>({
                "RowId":  "447",
                "Value":  null,
                "Data":  "data1",
                "AndAgain": null,
                "Name": "S-20190516-4622",
                "Other": "other2"
            }),
            Map<string, any>({
                "RowId":  "446",
                "Value":  "new val",
                "Data":  "data1",
                "AndAgain": "change me",
                "Name": "S-20190516-2368",
                "Other":  "other3"
            }),
            Map<string, any>({
                "RowId":  "445",
                "Value": "val",
                "Data": "other data",
                "AndAgain":  "again",
                "Name":  "S-20190516-9512",
                "Other": null
            })
        ], "RowId"));
        expect(updatedData).toHaveLength(4);
        expect(updatedData[0]).toStrictEqual( {
            "Data": null,
            "RowId": "448"
        });
        expect(updatedData[1]).toStrictEqual( {
            "AndAgain": null,
            "RowId": "447"
        });
        expect(updatedData[2]).toStrictEqual({
            "Value": "new val",
            "AndAgain": "change me",
            "RowId": "446"
        });
        expect(updatedData[3]).toStrictEqual({
            "Data": "other data",
            "RowId": "445"
        })
    });

    test("edited row added field", () => {
        const updatedData = (getUpdatedDataFromGrid(originalData, [
            Map<string, any>({
                "RowId":  "448",
                "New Field": "new value"
            })], "RowId"));
        expect(updatedData).toHaveLength(1);
        expect(updatedData[0]).toStrictEqual( {
            "New Field": "new value",
            "RowId": "448"
        });
    })
});

describe('CaseInsensitive', () => {

    test('Empty values', () => {
        expect(caseInsensitive(undefined, undefined)).toBeUndefined();
        expect(caseInsensitive(null, null)).toBeUndefined();
        expect(caseInsensitive({}, '')).toBeUndefined()
    });

    test('Case conversions', () => {
        expect(caseInsensitive({x: -1, xX: -2}, 'x')).toEqual(-1);
        expect(caseInsensitive({x: -1, xX: -2}, 'X')).toEqual(-1);
        expect(caseInsensitive({'x': -1, 'xX': -2}, 'xx')).toEqual(-2);
        expect(caseInsensitive({'x': -1, 'xX': -2}, 'X')).toEqual(-1);
        expect(caseInsensitive({'special-key': 42}, 'special key')).toBeUndefined();
        expect(caseInsensitive({'special-key': 42}, 'special-key')).toEqual(42);
    });
});

describe('contains', () => {

    test('Empty values', () => {
        expect(contains(undefined, undefined, undefined)).toBe(false);
        expect(contains('', '')).toBe(false);
        expect(contains('first', undefined)).toBe(false);
        expect(contains('', 'second')).toBe(false);
    });

    test('Case sensitivity', () => {
        expect(contains('S', 's')).toBe(true);
        expect(contains('S', 's', false)).toBe(true);
        expect(contains('S', 's', true)).toBe(false);
    });
});

describe('hasPrefix', () => {

    test('Empty values', () => {
        expect(hasPrefix(undefined, undefined, undefined)).toBe(false);
        expect(hasPrefix('', '')).toBe(false);
        expect(hasPrefix('here', '')).toBe(false);
        expect(hasPrefix('', 'there')).toBe(false);
    });

    test('Case sensitivity', () => {
        expect(hasPrefix('The', 't')).toBe(true);
        expect(hasPrefix('The', 't', true)).toBe(false);
        expect(hasPrefix('The', 'he')).toBe(false);
        expect(hasPrefix('The', 'he', true)).toBe(false);
        expect(hasPrefix('The', 'th', false)).toBe(true);
    });
});

describe('similaritySortFactory', () => {

    const values = ['S-11', '2015_08_09_13', '2015_08_09_12', 'S-1X', 'S-111', 'S-1', '6S-1', 'S-211'];

    function getValues(): Array<string> {
        return Array.from(values);
    }

    test('Empty token', () => {

        expect([].sort(similaritySortFactory(undefined)))
            .toMatchObject([]);

        expect(getValues().sort(similaritySortFactory('')))
            .toMatchObject(getValues().sort(naturalSort));
    });

    test('Undefined/null', () => {

        expect([].sort(similaritySortFactory('no results'))).toMatchObject([]);
        expect([undefined].sort(similaritySortFactory('no results'))).toMatchObject([undefined]);
        expect(['cool', undefined, 'coolest', null, 'lame'].sort(similaritySortFactory('')))
            .toMatchObject(['cool', 'coolest', 'lame', null, undefined]);
    });

    test('Exact matching', () => {

        let result = getValues().sort(similaritySortFactory(''));
        expect(result[0]).toEqual('6S-1'); // degrade to natural sort

        // case-insensitive
        result = getValues().sort(similaritySortFactory('s-'));
        expect(result[0]).toEqual('S-1');
        expect(result[1]).toEqual('S-1X');

        result = getValues().sort(similaritySortFactory('S-1'));
        expect(result[0]).toEqual('S-1');

        result = getValues().sort(similaritySortFactory('S-11'));
        expect(result[0]).toEqual('S-11');

        // case-sensitive
        result = getValues().sort(similaritySortFactory('s-1', true));
        expect(result[0]).toEqual('6S-1'); // degrade to natural sort
    });
});
