// import { SQLiteDriver } from './drivers/sqlite/SQLiteDriver';

export * as Core from './core';
export * as Drivers from './drivers';
export * as Realtime from './realtime';
export * as Client from './client';


// (async () => {
//     let db = new SQLiteDriver("./test.sqlite");
//     await db.connect();
//     await db.createCollection({
//         id: "ROOT",
//         name: "",
//         parentId: ""
//     });
//     await db.createCollection({
//         id: "001",
//         name: "users",
//         parentId: "ROOT"
//     });
//     await db.createCollection({
//         id: "002",
//         name: "profiles",
//         parentId: "001"
//     });
//     await db.createCollection({
//         id: "003",
//         name: "account",
//         parentId: "ROOT"
//     });

//     let r = await db.getCollectionsRecursive("ROOT");
//     // console.log(r);

//     await db.deleteCollection("001");

//     r = await db.getCollectionsRecursive("ROOT");
//     // console.log(r);

//     await db.createDocument({
//         id: 'user01',
//         parentId: '001',
//         key: '001',
//         value: {
//             name: "Teoflio",
//             address: {
//                 No: 4,
//                 Street: "Bui Hien"
//             },
//             enrolled: true,
//             friends: ["Cuden", "VHGK"],
//         }
//     })
//     let result = await db.getDocument('user01')
//     console.log(JSON.stringify(result));
//     await db.createDocument({
//         id: 'user01',
//         parentId: '001',
//         key: '001',
//         value: {
//             name: "Kien",
//             address: {
//                 No: 10,
//                 Street: "Bui Hien"
//             },
//             yob: 1998,
//             friends: ["Cuden", "Teoflio"],
//             isMale: false
//         }
//     })
//     result = await db.getDocument('user01')
//     console.log(JSON.stringify(result));
// })();