/* eslint-disable max-len */
/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

// Fungsi Firebase HTTP
exports.myHttpFunction = onRequest((request, response) => {
  // Menyimpan informasi ke log menggunakan logger
  logger.info("Permintaan HTTP diterima!");

  // Mengirim respons ke permintaan HTTP
  response.send("Hello from Firebase!");
});

const functions = require("firebase-functions");

const admin = require("firebase-admin");

const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const express = require("express");
const cors = require("cors");

// main app //
const app = express();
app.use(cors({origin: true}));
app.use(express.json());
app.use(express.urlencoded({extended: true}));


// database reference //
const db = admin.firestore();

// generate custom UID //
// eslint-disable-next-line require-jsdoc
function generateCustomUID(length) {
  // eslint-disable-next-line max-len
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}


// bagian API input job dari user //

// API add data or post data //
app.post("/api/add", (req, res) => {
  (async () => {
    try {
      const customId = generateCustomUID(20);
      const currentJobData = {
        jobId: customId,
        title: req.body.title,
        location: req.body.location,
        department: req.body.department,
        salaryRange: req.body.salaryRange,
        companyProfile: req.body.companyProfile,
        description: req.body.description,
        requirements: req.body.requirements,
        benefits: req.body.benefits,
        telecommuting: req.body.telecommuting,
        hasCompanyLog: req.body.hasCompanyLog,
        employmentType: req.body.employmentType,
        requiredExperience: req.body.requiredExperience,
        requiredEducation: req.body.requiredEducation,
        industry: req.body.industry,
        jobfunction: req.body.jobfunction,
        fraudulent: req.body.fraudulent,
        companyLogo: req.body.companyLogo,
        statusVerified: "Unknown",
      };
      await db.collection("workCollection").doc(customId).set(currentJobData);

      // eslint-disable-next-line max-len
      return res.status(200).send({status: "Success", msg: "Data Saved", jobId: customId});
    } catch (error) {
      console.log(error);
      return res.status(500).send({status: "Failed", msg: error});
    }
  })();
});

// app.post("/api/addDescription", (req, res) => {
//   (async () => {
//     try {
//       const customId = generateCustomUID(20);

//       const jobDescriptionData = {
//         descriptionId: customId,
//         logo: (req.body.logo === 'true'), // Convert string to boolean
//         contact: (req.body.contact === 'true'), // Convert string to boolean
//         job_description: req.body.job_description,
//         statusVerified: "Unknown",
//       };

//       await db.collection("descriptionCollection").doc(customId).set(jobDescriptionData);

//       return res.status(200).send({ status: "Success", msg: "Data Saved", descriptionId: customId });
//     } catch (error) {
//       console.log(error);
//       return res.status(500).send({ status: "Failed", msg: error });
//     }
//   })();
// });

const http = require("http");

app.post("/api/addDescription", async (req, res) => {
  try {
    const customId = generateCustomUID(20);

    const jobDescriptionData = {
      descriptionId: customId,
      logo: req.body.logo === "true",
      contact: req.body.contact === "true",
      job_description: req.body.job_description,
      statusVerified: "Unknown",
    };

    // eslint-disable-next-line max-len
    await db.collection("descriptionCollection").doc(customId).set(jobDescriptionData);

    const requestData = JSON.stringify(jobDescriptionData);

    const predictJobOptions = {
      hostname: "jobguardian-app-project.et.r.appspot.com",
      path: "/predictJob",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": requestData.length,
      },
    };

    // eslint-disable-next-line max-len
    const predictJobRequest = http.request(predictJobOptions, (predictJobResponse) => {
      let data = "";

      predictJobResponse.on("data", (chunk) => {
        data += chunk;
      });

      predictJobResponse.on("end", () => {
        try {
          const parsedData = JSON.parse(data);
          const predictedJob = parsedData.prediction;

          if (predictedJob === undefined) {
            console.error("Predicted job is undefined.");
            console.error("Received data:", parsedData);
            // eslint-disable-next-line max-len
            return res.status(500).send({status: "Failed", msg: "Predicted job is undefined"});
          } else {
            console.log("Predicted Job:", predictedJob);

            return res.status(200).send({
              "status": "Success",
              "msg": "Data Saved",
              "descriptionId": customId,
              "Predicted Job": predictedJob,
            });
          }
        } catch (error) {
          console.error("Error parsing response data:", error);
          console.error("Received data:", data);
          // eslint-disable-next-line max-len
          return res.status(500).send({status: "Failed", msg: "Error parsing response data"});
        }
      });
    });

    predictJobRequest.on("error", (error) => {
      console.error("Predict job request error:", error);
      // eslint-disable-next-line max-len
      return res.status(500).send({status: "Failed", msg: error.message || "Unknown error"});
    });

    predictJobRequest.write(requestData);
    predictJobRequest.end();
  } catch (error) {
    console.error("General error:", error);
    // eslint-disable-next-line max-len
    return res.status(500).send({status: "Failed", msg: error.message || "Unknown error"});
  }
});

// API mengambil data dengan specific id //
app.get("/api/get/:jobId", (req, res) => {
  (async () => {
    try {
      const jobId = req.params.jobId;
      const reqDoc = db.collection("workCollection").doc(jobId);
      const workCollection = await reqDoc.get();
      const response = workCollection.data();

      return res.status(200).send({status: "Success", data: response});
    } catch (error) {
      console.log(error);
      return res.status(500).send({status: "Failed", msg: error});
    }
  })();
});


app.get("/api/getDescription/:descriptionId", async (req, res) => {
  try {
    const descriptionId = req.params.descriptionId;

    const snapshot = await db.collection("descriptionCollection").doc(descriptionId).get();

    if (!snapshot.exists) {
      return res.status(404).send({status: "Failed", msg: "Description not found"});
    }

    const descriptionData = snapshot.data();
    return res.status(200).send({status: "Success", data: descriptionData});
  } catch (error) {
    console.log(error);
    return res.status(500).send({status: "Failed", msg: error});
  }
});

// API mengambil seluruh data dari workCollection on firestore //
app.get("/api/getAll", (req, res) => {
  (async () => {
    try {
      const query = db.collection("workCollection");
      const response = [];

      await query.get().then((data) => {
        const docs = data.docs;

        docs.map((doc) => {
          const selectedItem = {
            title: doc.data().title,
            location: doc.data().location,
            department: doc.data().department,
            salaryRange: doc.data().salaryRange,
            companyProfile: doc.data().companyProfile,
            description: doc.data().description,
            requirements: doc.data().requirements,
            benefits: doc.data().benefits,
            telecommuting: doc.data().telecommuting,
            hasCompanyLog: doc.data().hasCompanyLog,
            employmentType: doc.data().employmentType,
            requiredExperience: doc.data().requiredExperience,
            requiredEducation: doc.data().requiredEducation,
            industry: doc.data().industry,
            functionjo: doc.data().functionjob,
            fraudulent: doc.data().fraudulent,
            companyLogo: doc.data().companyLogo,
            status: doc.data().status,
          };
          response.push(selectedItem);
        });
        return response;
      });

      return res.status(200).send({status: "Success", data: response});
    } catch (error) {
      console.log(error);
      return res.status(500).send({status: "Failed", msg: error});
    }
  })();
});


// API update status verification job dengan specific id //
app.put("/api/updateStatusJobInput/:jobId", (req, res) => {
  (async () => {
    try {
      const jobId = req.params.jobId;
      const statusVerified = req.body.status;

      // update status pada Firestore di document berdasarkan jobID //
      // eslint-disable-next-line max-len
      await db.collection("workCollection").doc(jobId).update({status: statusVerified});

      // eslint-disable-next-line max-len
      return res.status(200).send({status: "Success", msg: "Data Updated", jobId: jobId});
    } catch (error) {
      console.log(error);
      return res.status(500).send({status: "Failed", msg: error});
    }
  })();
});

// API update status verification job dengan specific id //
app.put("/api/updateStatusJobDescription/:descriptionId", (req, res) => {
  (async () => {
    try {
      const descriptionId = req.params.descriptionId;
      const statusVerified = req.body.statusVerified;

      // update status pada Firestore di document berdasarkan descriptionId //
      // eslint-disable-next-line max-len
      await db.collection("descriptionCollection").doc(descriptionId).update({statusVerified: statusVerified});

      // eslint-disable-next-line max-len
      return res.status(200).send({status: "Success", msg: "Data Updated", descriptionId: descriptionId});
    } catch (error) {
      console.log(error);
      return res.status(500).send({status: "Failed", msg: error});
    }
  })();
});


// // bagian API untuk login dan registrasi user //

// // API register user
// app.post("/api/registerUser", async (req, res) => {
//   try {
//     const { username, email, password } = req.body;

//     if (!username || !email || !password) {
//       return res.status(400).send({ status: "Failed", msg: "Username, email, and password are required." });
//     }

//     const usersRef = db.collection("usersCollection");

//     // Check if email or username already exists
//     const usernameSnapshot = await usersRef.where("username", "==", username).get();
//     const emailSnapshot = await usersRef.where("email", "==", email).get();

//     if (!emailSnapshot.empty) {
//       return res.status(400).send({ status: "Failed", msg: "Email already exists." });
//     }

//     if (!usernameSnapshot.empty) {
//       return res.status(400).send({ status: "Failed", msg: "Username already exists." });
//     }

//     const newUser = {
//       username: username,
//       email: email,
//       password: password,
//     };

//     await usersRef.add(newUser);

//     return res.status(201).send({ status: "Success", msg: "User registered successfully." });
//   } catch (error) {
//     console.log(error);
//     return res.status(500).send({ status: "Failed", msg: error });
//   }
// });

// // Endpoint untuk melakukan login user
// // API login user
// app.post("/api/loginUser", (req, res) => {
//   (async () => {
//     try {
//       const {email, password} = req.body;

//       if (!email || !password) {
//         // eslint-disable-next-line max-len
//         return res.status(400).send({status: "Failed", msg: "Email and password are required."});
//       }

//       const usersRef = db.collection("usersCollection");
//       // eslint-disable-next-line max-len
//       const snapshot = await usersRef.where("email", "==", email).where("password", "==", password).get();

//       if (snapshot.empty) {
//         // eslint-disable-next-line max-len
//         return res.status(404).send({status: "Failed", msg: "Invalid email or password."});
//       }

//       // eslint-disable-next-line max-len
//       // jika login berhasil, ambil ID dari dokumen yang cocok dengan email dan password
//       let userId;
//       snapshot.forEach((doc) => {
//         userId = doc.id;
//       });

//       // eslint-disable-next-line max-len
//       return res.status(200).send({status: "Success", msg: "Login successful.", userId: userId});
//     } catch (error) {
//       console.log(error);
//       return res.status(500).send({status: "Failed", msg: error});
//     }
//   })();
// });

// Endpoint untuk register user dan menyimpan data di Firestore
app.post("/api/registerUserFirebase", async (req, res) => {
  try {
    const {username, email, password} = req.body;

    if (!username || !email || !password) {
      return res.status(400).send({status: "Failed", msg: "Username, email, and password are required."});
    }

    // Create user in Firebase Authentication
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: username,
    });

    const {uid, email: userEmail, displayName} = userRecord;

    const userData = {uid, email: userEmail, username: displayName, password: password};

    // Save user information to Firestore
    const usersRef = admin.firestore().collection("usersCollection");
    await usersRef.doc(uid).set(userData);

    return res.status(201).send({status: "Success", msg: "User registered successfully.", userId: uid});
  } catch (error) {
    console.error(error);
    return res.status(500).send({status: "Failed", msg: error});
  }
});


// Endpoint untuk melakukan login user
// API login user
app.post("/api/loginUserFirebase", (req, res) => {
  (async () => {
    try {
      const {email, password} = req.body;

      if (!email || !password) {
        // eslint-disable-next-line max-len
        return res.status(400).send({status: "Failed", msg: "Email and password are required."});
      }

      const usersRef = db.collection("usersCollection");
      // eslint-disable-next-line max-len
      const snapshot = await usersRef.where("email", "==", email).where("password", "==", password).get();

      if (snapshot.empty) {
        // eslint-disable-next-line max-len
        return res.status(404).send({status: "Failed", msg: "Invalid email or password."});
      }

      // eslint-disable-next-line max-len
      // jika login berhasil, ambil ID dari dokumen yang cocok dengan email dan password
      let userId;
      snapshot.forEach((doc) => {
        userId = doc.id;
      });

      // eslint-disable-next-line max-len
      return res.status(200).send({status: "Success", msg: "Login successful.", userId: userId});
    } catch (error) {
      console.log(error);
      return res.status(500).send({status: "Failed", msg: error});
    }
  })();
});


// API get data User //
app.put("/api/updateBiodataUser/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const {fullName, birthDate, contact} = req.body;

    res.status(200).json({userId, message: "User profile updated"});

    if (!userId) {
      throw new Error("UserId is required");
    }

    // Pastikan minimal salah satu informasi yang akan diperbarui ada
    if (!fullName && !contact && !birthDate) {
      // eslint-disable-next-line max-len
      throw new Error("At least one field (fullName, contact, or birthDate) is required for update");
    }

    const updateData = {};

    if (fullName) {
      updateData.fullName = fullName;
    }

    if (birthDate) {
      updateData.birthDate = birthDate;
    }

    if (contact) {
      updateData.contact = contact;
    }

    // eslint-disable-next-line max-len
    await admin.firestore().collection("usersCollection").doc(userId).update(updateData);

    // eslint-disable-next-line max-len
    res.status(200).send({message: "Biodata updated successfully", updatedFields: updateData});
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({error: error.message});
  }
});


// API update status verification job dengan specific id //
app.put("/api/updateUserProfile/:userId", (req, res) => {
  (async () => {
    try {
      const userId = req.params.userId;
      const updatedfullName = req.body.status;
      const birthDate = req.body.birthDate;
      const contact = req.body.contact;

      res.status(200).json({userId, message: "User profile retrieved"});

      if (!userId) {
        throw new Error("User ID Not Found");
      }

      // Pastikan minimal salah satu informasi yang akan diperbarui ada
      if (!updatedfullName && !contact && !birthDate) {
      // eslint-disable-next-line max-len
        throw new Error("Nothing is Updated");
      }

      // update status pada Firestore di document berdasarkan userID //
      // eslint-disable-next-line max-len
      await db.collection("usersCollection").doc(userId).update({status: updatedfullName, birthDate, contact});

      // eslint-disable-next-line max-len
      return res.status(200).send({status: "Success", msg: "Data Updated", userId: userId});
    } catch (error) {
      console.log(error);
      return res.status(500).send({status: "Failed", msg: error});
    }
  })();
});

// API get user profile //
app.get("/api/getUserProfile/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    if (!userId) {
      throw new Error("UserId is required");
    }

    const userSnapshot = await admin.firestore().collection("usersCollection").doc(userId).get();

    if (!userSnapshot.exists) {
      throw new Error("User not found");
    }

    const userData = userSnapshot.data();

    res.status(200).send({userProfile: userData});
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({error: error.message});
  }
});

const {Storage} = require("@google-cloud/storage");

// Inisialisasi Firebase Cloud Storage

// Inisialisasi Firebase Cloud Storage
const storage = new Storage();
const bucket = storage.bucket("jobguardian-app-project.appspot.com");

// Endpoint untuk upload foto profil ke Cloud Storage
app.post("/api/uploadProfilePicture/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const fileBuffer = req.body.profilePicture; // Mengambil buffer gambar dari body request

    if (!userId || !fileBuffer) {
      return res.status(400).send({status: "Failed", msg: "User ID and profile picture buffer are required."});
    }

    const timestamp = new Date().getTime(); // Membuat timestamp sebagai UUID sederhana

    const uniqueFilename = `${userId}_${timestamp}_profilePicture.jpg`; // Menamai gambar

    const blob = bucket.file(uniqueFilename);
    const blobStream = blob.createWriteStream({
      metadata: {
        contentType: "auto",
      },
    });

    blobStream.on("error", (error) => {
      console.error("Error uploading file:", error);
      return res.status(500).send({status: "Failed", msg: "Error uploading file to Cloud Storage"});
    });

    blobStream.on("finish", async () => {
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;

      // Update URL foto profil pengguna di database
      await admin.firestore().collection("usersCollection").doc(userId).update({profilePicture: publicUrl});

      return res.status(200).send({status: "Success", msg: "Profile picture uploaded successfully", imageUrl: publicUrl});
    });

    blobStream.end(Buffer.from(fileBuffer, "base64")); // Mengakhiri stream dengan buffer gambar
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).send({status: "Failed", msg: error.message || "Unknown error"});
  }
});

// exports api to firebase cloud function //
exports.app = functions.https.onRequest(app);
