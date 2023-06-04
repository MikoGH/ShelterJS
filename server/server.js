import express from "express"
import mysql from "mysql"
import cors from "cors"
import jwt from "jsonwebtoken"
import multer from "multer";
import path from "path";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("./public"));
// app.use('/uploads/actions', express.static(path.join(__dirname, '../uploads/actions')));

const db = mysql.createConnection({
    host: "mysql93.1gb.ru",
    user: "gb_bshelter",
    password: "QyDMBz-S9D3P",
    database: "gb_bshelter"
});

//#region Accounts
// Authorization
app.post('/auth', (req, res) => {
    // authTokens = {};
    process.env.JWT_SECRET = "Secret";
    const sqlT = `INSERT INTO accounts (email, password) \
                SELECT ?,?`;

    const sql = `SELECT id, nameFirst, nameSecond, email, password 
                FROM accounts
                WHERE email = ?`;

    const login = req.body.email;
    const password = req.body.password;

    // db.query(sqlT, [login, password], (err,result)=>{});
    db.query(sql, [login, password], (err,result)=>{
        if(err) return res.json({Message: "Error"});
        let user = result[0];
        if (user === undefined) {
            console.log("Пользователь не найден");
            return res.json({Message: "Error"});
        }
        else {
            if (user["password"] == password) {
                const jwtToken = jwt.sign(
                    { id: user.id, login: user.login },
                    process.env.JWT_SECRET
                );
                return res.json({ token: jwtToken });
            }
            else {
                console.log("Пароль не подходит");
                return res.json({Message: "Error"});
            }
        }
    });
});
//#endregion


//#region Lists
// Species
app.get('/admin/species', (req, res) => {
    const sql = `SELECT id, nameSpecies 
                FROM species`;
    db.query(sql, (err,result)=>{
        if(err) return res.json({Message: "Error"});
        return res.json(result);
    })
});

// Breeds
app.get('/admin/breeds', (req, res) => {
    const sql = `SELECT breeds.id, nameSpecies, nameBreed 
                FROM breeds
                LEFT OUTER JOIN species
                ON (breeds.idSpecies = species.id)`;
    db.query(sql, (err,result)=>{
        if(err) return res.json({Message: "Error"});
        return res.json(result);
    })
});
//#endregion


//#region Pets
// Table view
app.get('/admin', (req, res) => {
    const sql = `SELECT pets.id, namePet, nameBreed, nameSpecies, gender, birth, description, path 
                FROM pets
                LEFT OUTER JOIN breeds
                ON (pets.idBreed = breeds.id)
                LEFT OUTER JOIN species
                ON (breeds.idSpecies = species.id)
                LEFT OUTER JOIN gallery
                ON (gallery.idPet = pets.id AND gallery.profile = 1)`;
    db.query(sql, (err,result)=>{
        if(err) return res.json({Message: "Error"});
        return res.json(result);
    })
});

// Add
app.post('/admin/saddpet', (req, res) => {
    const sql1 = `INSERT INTO species (nameSpecies, isreal) \
                SELECT ?,false FROM DUAL \
                WHERE NOT EXISTS (SELECT * FROM species WHERE nameSpecies=? LIMIT 1);`;
    const values1 = [
        req.body.nameSpecies,
        req.body.nameSpecies
    ];
                
    const sql2 = `INSERT INTO breeds (idSpecies, nameBreed, isreal) \
                SELECT (SELECT id FROM species WHERE nameSpecies=? LIMIT 1), ?, false FROM DUAL \
                WHERE NOT EXISTS (SELECT * FROM breeds WHERE idSpecies=(SELECT id FROM species WHERE nameSpecies=? LIMIT 1) AND nameBreed=? LIMIT 1);`;
    const values2 = [
        req.body.nameSpecies,
        req.body.nameBreed,
        req.body.nameSpecies,
        req.body.nameBreed
    ];
                
    const sql3 = `INSERT INTO pets (namePet, idBreed, gender, description) VALUES \
                (?, (SELECT id FROM breeds WHERE nameBreed=? AND idSpecies=(SELECT id FROM species WHERE nameSpecies=? LIMIT 1) LIMIT 1), ?, ?);`;
    const values3 = [
        req.body.namePet,
        req.body.nameBreed,
        req.body.nameSpecies,
        req.body.gender,
        req.body.description
    ];

    if (req.body.namePet === "")
    {
        return res.json();
    }
    
    db.query(sql1, values1, (err,result)=>{
            if(err) { console.log(err); return res.json({Message: "Error"});  }
        // return res.json(result);
    })
    db.query(sql2, values2, (err,result)=>{
            if(err) { console.log(err); return res.json({Message: "Error"});  }
        // return res.json(result);
    })
    db.query(sql3, values3, (err,result)=>{
            if(err) { console.log(err); return res.json({Message: "Error"});  }
            return res.json(result);
    });
});

// Edit
app.post('/admin/edit/:id', (req, res) => {
    const sql1 = `INSERT INTO species (nameSpecies, isreal) \
                SELECT ?,false FROM DUAL \
                WHERE NOT EXISTS (SELECT * FROM species WHERE nameSpecies=? LIMIT 1);`;
    const values1 = [
        req.body.nameSpecies,
        req.body.nameSpecies
    ];
                
    const sql2 = `INSERT INTO breeds (idSpecies, nameBreed, isreal) \
                SELECT (SELECT id FROM species WHERE nameSpecies=? LIMIT 1), ?, false FROM DUAL \
                WHERE NOT EXISTS (SELECT * FROM breeds WHERE idSpecies=(SELECT id FROM species WHERE nameSpecies=? LIMIT 1) AND nameBreed=? LIMIT 1);`;
    const values2 = [
        req.body.nameSpecies,
        req.body.nameBreed,
        req.body.nameSpecies,
        req.body.nameBreed
    ];
                
    const sql3 = `UPDATE pets \
                SET namePet = ?, idBreed = (SELECT id FROM breeds WHERE nameBreed=? AND idSpecies=(SELECT id FROM species WHERE nameSpecies=? LIMIT 1) LIMIT 1), \
                gender = ?, description = ? \
                WHERE id = ?`;
    const id = req.params.id;
    const values3 = [
        req.body.namePet,
        req.body.nameBreed,
        req.body.nameSpecies,
        req.body.gender,
        req.body.description,
        id
    ];

    db.query(sql1, values1, (err,result)=>{
            if(err) { console.log(err); return res.json({Message: "Error"});  }
        // return res.json(result);
    })
    db.query(sql2, values2, (err,result)=>{
            if(err) { console.log(err); return res.json({Message: "Error"});  }
        // return res.json(result);
    })
    db.query(sql3, values3, (err,result)=>{
            if(err) { console.log(err); return res.json({Message: "Error"});  }
            return res.json(result);
    });
});

// Delete
app.delete('/admin/delete/:id', (req, res) => {
    const sql = `DELETE FROM pets WHERE id = ?`;
    const id = req.params.id;
    
    db.query(sql, [id], (err,result)=>{
        if(err) { console.log(err); return res.json({Message: "Error"});  }
        return res.json(result);
    });
});

// View
app.get('/admin/view/:idPet', (req, res) => {
    const sql = `SELECT pets.id, namePet, nameBreed, nameSpecies, gender, birth, description \
                FROM pets \
                LEFT OUTER JOIN breeds \
                ON (pets.idBreed = breeds.id) \
                LEFT OUTER JOIN species \
                ON (breeds.idSpecies = species.id) \
                WHERE pets.id = ?`;
    const id = req.params.idPet;
    
    db.query(sql, [id], (err,result)=>{
        if(err) { console.log(err); return res.json({Message: "Error"});  }
        return res.json(result[0]);
    });
});
//#endregion


//#region Events
// Events
app.get('/admin/view/:idPet/events', (req, res) => {
    const idPet = req.params.idPet;
    const sql = `SELECT id, nameEvent, dateEvent 
                FROM events 
                WHERE idPet = ?`;
    db.query(sql, [idPet], (err,result)=>{
        if(err) { console.log(id); return res.json({Message: "Error"}) };
        return res.json(result);
    })
});

// Add event
app.post('/admin/view/:idPet/events/add', (req, res) => {
    const sql = `INSERT INTO events (idPet, nameEvent, dateEvent) VALUES \
                (?, ?, ?);`;
    const values = [
        req.params.idPet,
        req.body.nameEvent,
        req.body.dateEvent
    ];

    db.query(sql, values, (err,result)=>{
            if(err) { console.log(err); return res.json({Message: "Error"});  }
            return res.json(result);
    });
});

// Edit event
app.post('/admin/view/:idPet/events/edit/:id', (req, res) => {        
    const sql = `UPDATE events \
                SET nameEvent = ?, dateEvent = ? \
                WHERE id = ?`;
    const id = req.params.id;
    const values = [
        req.body.nameEvent,
        req.body.dateEvent,
        id
    ];

    db.query(sql, values, (err,result)=>{
            if(err) { console.log(err); return res.json({Message: "Error"});  }
            return res.json(result);
    });
});

// Delete event
app.delete('/admin/view/:idPet/events/delete/:idEvent', (req, res) => {
    const sql = `DELETE FROM events WHERE id = ?`;
    // const id = req.params.id;
    const idEvent = req.params.idEvent;
    
    db.query(sql, [idEvent], (err,result)=>{
        if(err) { console.log(err); return res.json({Message: "Error"});  }
        return res.json(result);
    });
});

// View event
app.get('/admin/view/:idPet/events/view/:idEvent', (req, res) => {
    const sql = `SELECT events.id, nameEvent, dateEvent \
                FROM events \
                WHERE events.id = ?`;
    const idEvent = req.params.idEvent;
    
    db.query(sql, [idEvent], (err,result)=>{
        if(err) { console.log(err); return res.json({Message: "Error"});  }
        return res.json(result[0]);
    });
});
//#endregion


//#region Gallery
var storage = multer.diskStorage({
    destination: (req, file, callBack) => {
        callBack(null, './public/petimages/');
    },
    filename: (req, file, callBack) => {
        callBack(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({storage: storage});

// Gallery
app.get('/admin/view/:idPet/gallery', (req, res) => {
    const idPet = req.params.idPet;
    const sql = `SELECT id, path, profile 
                FROM gallery 
                WHERE idPet = ?`;
    db.query(sql, [idPet], (err,result)=>{
        if(err) { console.log(id); return res.json({Message: "Error"}) };
        return res.json(result);
    })
});

// Add image
app.post('/admin/view/:idPet/gallery/add', upload.single("file"), (req, res) => {
    if (!req.file) {
        console.log("No file upload");
    } else { 
        var imgsrc = req.file.filename;
        const values = [
            req.params.idPet,
            imgsrc,
            false
        ];
        const sql = `INSERT INTO gallery (idPet, path, profile) VALUES (?, ?, ?);`;
        db.query(sql, values, (err, result) => {
            if (err) throw err;
            console.log("file uploaded");
        });
    }
});

// Edit image
app.post('/admin/view/:idPet/gallery/edit/:id', (req, res) => {        
    const sql1 = `UPDATE gallery \
                SET profile = 0 \
                WHERE idPet = ?`;
    const sql2 = `UPDATE gallery \
                SET profile = 1 \
                WHERE id = ?`;
    const idPet = req.params.idPet;
    const id = req.params.id;

    db.query(sql1, [idPet], (err,result)=>{
        if(err) { console.log(err); return res.json({Message: "Error"});  }
    });
    db.query(sql2, [id], (err,result)=>{
        if(err) { console.log(err); return res.json({Message: "Error"});  }
        return res.json(result);
});
});

// Delete image
app.delete('/admin/view/:idPet/gallery/delete/:id', (req, res) => {
    const sql = `DELETE FROM gallery WHERE id = ?`;
    // const id = req.params.id;
    const id = req.params.id;
    
    db.query(sql, [id], (err,result)=>{
        if(err) { console.log(err); return res.json({Message: "Error"});  }
        return res.json(result);
    });
});
//#endregion

app.listen(3000, ()=>{
    console.log("listening");
})