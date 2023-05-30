const express = require("express");
const mysql = require("mysql");
const morgan = require("morgan");
const app = express();
app.use(morgan("dev"));
const port = 3000;
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "1234",
  database: "prepeat",
});

connection.connect((error) => {
  if (error) {
    console.log("Error connecting to database:", error);
  } else {
    console.log("Connected to database successfully");
  }
});

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.post("/api/register", async (req, res) => {
  const {
    isCustomer,
    name,
    mobileNumber,
    emailId,
    password,
    restaurantName,
    restaurantAddress,
  } = req.body;

  const query = isCustomer
    ? `INSERT INTO registered_users (name, mobileNumber, emailId, password) VALUES ( ?, ?, ?, ?)`
    : `INSERT INTO registered_restaurants (name, mobileNumber, emailId, password, restaurantName, restaurantAddress) VALUES ( ?, ?, ?, ?,?,?)`;
  const values = [
    name,
    mobileNumber,
    emailId,
    password,
    restaurantName,
    restaurantAddress,
  ];

  connection.query(query, values, (error, result) => {
    if (error) {
      console.log("Error inserting data into database:", error.sqlMessage);
      res.send({
        message:
          "Sorry, your details provided are either already existing or invalid.",
        success: false,
      });
    } else {
      res.send({
        message: "Registered successfully, please proceed to login.",
        success: true,
      });
    }
  });
});

app.post("/api/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  // Check if the email exists in the registered_restaurants table
  connection.query(
    "SELECT * FROM registered_restaurants WHERE emailId = ?",
    email,
    (error, results, fields) => {
      if (error) throw error;

      // If the email exists in the registered_restaurants table and the password matches, send back a success response
      if (results.length > 0 && results[0].password === password) {
        res.json({
          success: true,
          message: "Login successful.",
          isCustomer: false,
          name: results[0].name,
        });
      } else {
        // If the email does not exist in the registered_restaurants table, check the registered_users table
        connection.query(
          "SELECT * FROM registered_users WHERE emailId = ?",
          email,
          (error, results, fields) => {
            if (error) throw error;

            // If the email exists in the registered_users table and the password matches, send back a success response
            if (results.length > 0 && results[0].password === password) {
              res.json({
                success: true,
                message: "Login successful.",
                isCustomer: true,
                name: results[0].name,
              });
            } else {
              // If the email does not exist in either table or the password does not match, send back an error response
              res.json({
                success: false,
                message: "Invalid email or password",
              });
            }
          }
        );
      }
    }
  );
});

//For restaurant----------------------------------------------------------------------------------------------------
app.post("/api/getRestaurantProfile", (req, res) => {
  const email = req.body.emailId;
  const password = req.body.password;

  // Check if the email exists in the registered_restaurants table
  connection.query(
    "SELECT * FROM registered_restaurants WHERE emailId = ? AND password = ?",
    [email, password],
    (error, results, fields) => {
      if (error) {
        res.json({
          success: false,
          message: "Error fetching data from database.",
        });
        throw error;
      }

      // If the email exists in the registered_restaurants table and the password matches, send back the restaurant profile details
      if (results.length > 0) {
        res.json({
          success: true,
          message: "",
          name: results[0].name,
          mobileNumber: results[0].mobileNumber,
          restaurantName: results[0].restaurantName,
          restaurantAddress: results[0].restaurantAddress,
          upiId: results[0].upiId,
          image64: results[0].image,
          latitude: results[0].latitude,
          longitude: results[0].longitude,
        });
      } else {
        res.json({
          success: false,
          message: "Invalid email or password.",
        });
      }
    }
  );
});

app.post("/api/updateRestaurantProfile", (req, res) => {
  const {
    emailId,
    password,
    name,
    mobileNumber,
    restaurantName,
    restaurantAddress,
    upiId,
    image64,
    latitude,
    longitude,
  } = req.body;

  connection.query(
    "SELECT * FROM registered_restaurants WHERE emailId = ? AND password = ?",
    [emailId, password],
    (error, results, fields) => {
      if (error) {
        res.json({
          message: "Error occured in the backend while running database query.",
          success: false,
        });
        throw error;
      }

      if (results.length > 0) {
        connection.query(
          "UPDATE registered_restaurants SET name = ?, mobileNumber = ?, restaurantName = ?, restaurantAddress = ?, upiId = ?, image = ?, latitude = ?, longitude = ? WHERE (emailId = ? AND password = ?)",
          [
            name,
            mobileNumber,
            restaurantName,
            restaurantAddress,
            upiId,
            image64,
            latitude,
            longitude,
            emailId,
            password,
          ],
          (error, results, fields) => {
            if (error) {
              res.json({
                success: false,
                message:
                  "Error occurred while updating the data in the database.",
              });
            }
            res.json({
              success: true,
              message: "Profile updated successfully.",
            });
          }
        );
      } else {
        res.json({
          success: false,
          message: "Incorrect password or email.",
        });
      }
    }
  );
});

app.post("/api/getRestaurantDashboardName", (req, res) => {
  const { emailId, password } = req.body;
  connection.query(
    "SELECT * FROM registered_restaurants WHERE emailId = ? AND password = ?",
    [emailId, password],
    (error, results, fields) => {
      if (error) {
        res.json({
          success: false,
          name: "please login",
        });
      } else if (results.length > 0) {
        res.json({
          success: true,
          name: results[0].name,
        });
      } else {
        res.json({
          success: false,
          name: "please login",
        });
      }
    }
  );
});

app.post("/api/addMenuItem", (req, res) => {
  const { name, price, image, email, password } = req.body;

  // find the registered restaurant based on the given email and password
  const query = `SELECT id FROM registered_restaurants WHERE emailId = ? AND password = ?`;
  connection.query(query, [email, password], (error, results) => {
    if (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Error fetching registered restaurant.",
      });
      return;
    }

    if (results.length === 0) {
      console.log("error is length 0");
      res.status(400).json({
        success: false,
        message: "No registered restaurant found with such details.",
      });
      return;
    }

    // insert the menu item with the foreign key from the registered restaurant
    const restaurantId = results[0].id;
    const insertQuery = `INSERT INTO menu_items (itemName, unitPrice, image, restaurant_id) VALUES (?, ?, ?, ?)`;
    connection.query(
      insertQuery,
      [name, price, image, restaurantId],
      (error, results) => {
        if (error) {
          res.json({
            success: false,
            message:
              "Item invalid, please make sure you put a numerical value for the price, also same item name is not already existing. If the issue still persist, check if the fields are non empty.",
          });
          return;
        } else {
          res.json({ success: true, message: "Menu item added successfully." });
        }
      }
    );
  });
});

app.post("/api/getMenuItems", (req, res) => {
  const { emailId, password } = req.body;

  // find the registered restaurant based on the given emailId and password
  const query = `SELECT id FROM registered_restaurants WHERE emailId = ? AND password = ?`;
  connection.query(query, [emailId, password], (error, results) => {
    if (error) {
      console.error(error);
      res.json({
        success: false,
        message: "Error fetching registered restaurant.",
      });
      return;
    }

    if (results.length === 0) {
      res.json({
        success: false,
        message: "No registered restaurant found with such details.",
      });
      return;
    }

    // fetch the menu items for the restaurant with the matching id
    const restaurantId = results[0].id;
    const selectQuery = `SELECT * FROM menu_items WHERE restaurant_id = ?`;
    connection.query(selectQuery, [restaurantId], (error, results) => {
      if (error) {
        console.error(error);
        res.status(500).json({
          success: false,
          message: "Error fetching menu items.",
        });
        return;
      }

      res.json({
        success: true,
        message: "",
        data: results,
      });
    });
  });
});

app.post("/api/deleteMenuItem", (req, res) => {
  const { id, emailId, password } = req.body;

  // find the registered restaurant based on the given email and password
  const query = `SELECT id FROM registered_restaurants WHERE emailId = ? AND password = ?`;
  connection.query(query, [emailId, password], (error, results) => {
    if (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Error fetching registered restaurant.",
      });
      return;
    }

    if (results.length === 0) {
      res.status(400).json({
        success: false,
        message: "No registered restaurant found with such details.",
      });
      return;
    }

    const restaurantId = results[0].id;

    // delete the menu item with the given id and restaurant_id
    const deleteQuery = `DELETE FROM menu_items WHERE id = ? AND restaurant_id = ?`;
    connection.query(deleteQuery, [id, restaurantId], (error, results) => {
      if (error) {
        console.error(error);
        res.json({
          success: false,
          message: "Error deleting menu item.",
        });
        return;
      }

      if (results.affectedRows === 0) {
        res.status(400).json({
          success: false,
          message: "No menu item found with such details.",
        });
        return;
      }

      res.json({
        success: true,
        message: "Menu item deleted successfully.",
      });
    });
  });
});

app.post("/api/getRestaurantOrders", (req, res) => {
  const { emailId, password, progress } = req.body;
  // Verify restaurant's emailId and password
  connection.query(
    "SELECT id FROM registered_restaurants WHERE emailId = ? AND password = ?",
    [emailId, password],
    (error, results) => {
      if (error) {
        console.error(`Error fetching restaurant ID: ${error}`);
        res.status(500).json({
          success: false,
          message: "Error fetching restaurant ID",
          data: null,
        });
      } else if (results.length === 0) {
        console.error("Invalid emailId or password");
        res.status(401).json({
          success: false,
          message: "Invalid emailId or password",
          data: null,
        });
      } else {
        const restaurantId = results[0].id;

        // Fetch orders from the database for the restaurant based on progress
        let query =
          "SELECT orders.*, registered_users.name AS user_name FROM orders JOIN registered_users ON orders.user_id = registered_users.id WHERE restaurant_id = ?";
        let params = [restaurantId];

        if (progress === "Requested") {
          query += " AND order_progress = ?";
          params.push("requested");
        } else if (progress === "Completed") {
          query += " AND (order_progress = ? OR order_progress = ?)";
          params.push("completed", "rejected");
        } else {
          // do nothing, fetch all orders
          query += " AND order_progress NOT IN (?, ?, ?)";
          params.push("requested", "completed", "rejected");
        }

        connection.query(query, params, (error, results) => {
          if (error) {
            console.error(`Error fetching restaurant's orders: ${query}`);
            res.status(500).json({
              success: false,
              message: "Error fetching restaurant's orders",
              data: null,
            });
          } else {
            const orders = results.map((order) => ({
              orderId: order.id,
              orderDateTime: order.order_datetime,
              userName: order.user_name,
              orderProgress: order.order_progress,
              cart: JSON.parse(order.cart),
            }));

            res.status(200).json({
              success: true,
              message: `Fetched ${orders.length} orders for restaurant ${restaurantId} with progress ${progress}`,
              data: orders.reverse(),
            });
          }
        });
      }
    }
  );
});

app.post("/api/updateOrderProgress", (req, res) => {
  const { emailId, password, orderId, isAccepted } = req.body;
  const progress = isAccepted;

  // Verify restaurant's emailId and password
  connection.query(
    "SELECT id FROM registered_restaurants WHERE emailId = ? AND password = ?",
    [emailId, password],
    (error, results) => {
      if (error) {
        console.error(`Error fetching restaurant ID: ${error}`);
        res.status(500).json({
          success: false,
          message: "Error fetching restaurant ID",
          data: null,
        });
      } else if (results.length === 0) {
        console.error("Invalid emailId or password");
        res.status(401).json({
          success: false,
          message: "Invalid emailId or password",
          data: null,
        });
      } else {
        const restaurantId = results[0].id;

        // Update order_progress in the database
        connection.query(
          "UPDATE orders SET order_progress = ? WHERE id = ? AND restaurant_id = ?",
          [progress, orderId, restaurantId],
          (error, results) => {
            if (error) {
              console.error(`Error updating order progress: ${error}`);
              res.status(500).json({
                success: false,
                message: "Error updating order progress",
                data: null,
              });
            } else if (results.affectedRows === 0) {
              console.error("Invalid order ID or restaurant ID");
              res.status(400).json({
                success: false,
                message: "Invalid order ID or restaurant ID",
                data: null,
              });
            } else {
              res.status(200).json({
                success: true,
                message: `Updated order progress to ${progress} for order ${orderId}`,
                data: null,
              });
            }
          }
        );
      }
    }
  );
});

//For users---------------------------------------------------------------------------------------
app.post("/api/getUserDashboardName", (req, res) => {
  const { emailId, password } = req.body;
  connection.query(
    "SELECT * FROM registered_users WHERE emailId = ? AND password = ?",
    [emailId, password],
    (error, results, fields) => {
      if (error) {
        res.json({
          success: false,
          name: "please login",
        });
      } else if (results.length > 0) {
        res.json({
          success: true,
          name: results[0].name,
        });
      } else {
        res.json({
          success: false,
          name: "please login",
        });
      }
    }
  );
});

app.post("/api/getUserProfile", (req, res) => {
  const email = req.body.emailId;
  const password = req.body.password;

  // Check if the email exists in the registered_users table
  connection.query(
    "SELECT * FROM registered_users WHERE emailId = ? AND password = ?",
    [email, password],
    (error, results, fields) => {
      if (error) {
        res.json({
          success: false,
          message: "Error fetching data from database.",
        });
        throw error;
      }

      // If the email exists in the registered_users table and the password matches, send back the user profile details
      if (results.length > 0) {
        res.json({
          success: true,
          message: "",
          name: results[0].name,
          mobileNumber: results[0].mobileNumber,
          upiId: results[0].upiId,
        });
      } else {
        res.json({
          success: false,
          message: "Invalid email or password.",
        });
      }
    }
  );
});

app.post("/api/updateUserProfile", (req, res) => {
  const { emailId, password, name, mobileNumber, upiId } = req.body;

  connection.query(
    "SELECT * FROM registered_users WHERE emailId = ? AND password = ?",
    [emailId, password],
    (error, results, fields) => {
      if (error) {
        res.json({
          message: "Error occured in the backend while running database query.",
          success: false,
        });
        throw error;
      }

      if (results.length > 0) {
        connection.query(
          "UPDATE registered_users SET name = ?, mobileNumber = ?,  upiId = ? WHERE (emailId = ? AND password = ?)",
          [name, mobileNumber, upiId, emailId, password],
          (error, results, fields) => {
            if (error) {
              res.json({
                success: false,
                message:
                  "Error occurred while updating the data in the database.",
              });
              throw error;
            }
            res.json({
              success: true,
              message: "Profile updated successfully.",
            });
          }
        );
      } else {
        res.json({
          success: false,
          message: "Incorrect password or email.",
        });
      }
    }
  );
});

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const earthRadius = 6371; // in kilometers

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = earthRadius * c;

  return distance;
};

const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

app.post("/api/getRestaurants", (req, res) => {
  const { emailId, password, userLat, userLon } = req.body;

  // Check if the user is valid by searching in the registered_users table
  connection.query(
    "SELECT * FROM registered_users WHERE emailId = ? AND password = ?",
    [emailId, password],
    (error, results, fields) => {
      if (error) {
        res.json({
          success: false,
          message: "Error fetching data from database.",
        });
        throw error;
      } else if (results.length > 0) {
        // If the user is valid, fetch all restaurants' details from the registered_restaurants table
        connection.query(
          "SELECT id, restaurantName, restaurantAddress, image, latitude, longitude FROM registered_restaurants",
          (error, results, fields) => {
            if (error) {
              res.json({
                success: false,
                message: "Error fetching data from database.",
              });
              throw error;
            }

            // If there are any restaurants in the registered_restaurants table, calculate the distance to each restaurant and add it to the JSON object
            if (results.length > 0) {
              const restaurantsWithDistance = results.map((restaurant) => {
                const distance =
                  restaurant.latitude && userLat
                    ? calculateDistance(
                        userLat,
                        userLon,
                        restaurant.latitude,
                        restaurant.longitude
                      )
                    : "NA";
                return { ...restaurant, distance };
              });

              res.json({
                success: true,
                message: "Restaurant data fetched successfully.",
                restaurants: restaurantsWithDistance,
              });
            } else {
              res.json({
                success: false,
                message: "No restaurants found in the database.",
              });
            }
          }
        );
      } else {
        res.json({
          success: false,
          message: "Invalid email or password.",
        });
      }
    }
  );
});

app.post("/api/getMenuBasedOnLocation", (req, res) => {
  const { userLat, userLon } = req.body;
  connection.query(
    "SELECT r.id, r.restaurantName, r.latitude, r.longitude, m.id AS itemId, m.itemName, m.unitPrice, m.image FROM registered_restaurants r LEFT JOIN menu_items m ON r.id = m.restaurant_id",
    (error, results, fields) => {
      if (error) {
        res.json({
          success: false,
          message: "Error fetching data from database.",
        });
        throw error;
      }

      const restaurantsWithDistance = results
        .map((restaurant) => {
          const distance =
            restaurant.latitude && userLat
              ? calculateDistance(
                  userLat,
                  userLon,
                  restaurant.latitude,
                  restaurant.longitude
                )
              : "NA";
          return { ...restaurant, distance };
        })
        .filter((restaurant) => restaurant.distance <= 200);

      const restaurants = {};
      restaurantsWithDistance.forEach((restaurant) => {
        if (!restaurants[restaurant.id]) {
          restaurants[restaurant.id] = {
            id: restaurant.id,
            name: restaurant.restaurantName,
            latitude: restaurant.latitude,
            longitude: restaurant.longitude,
            distance: restaurant.distance,
            menuItems: [],
          };
        }
        if (restaurant.itemId) {
          restaurants[restaurant.id].menuItems.push({
            itemId: restaurant.itemId,
            itemName: restaurant.itemName,
            unitPrice: restaurant.unitPrice,
            image: restaurant.image,
          });
        }
      });

      const responseRestaurants = Object.values(restaurants);

      if (responseRestaurants.length > 0) {
        res.json({
          success: true,
          message: "Restaurant data fetched successfully.",
          restaurants: responseRestaurants,
        });
      } else {
        res.json({
          success: false,
          message: "No restaurants found within 200 kilometers.",
        });
      }
    }
  );
});

app.post("/api/getMenuItemsByRestaurantId", (req, res) => {
  const { restaurantId } = req.body;

  // fetch the menu items for the specified restaurant
  const selectQuery = `SELECT id, itemName, unitPrice, image FROM menu_items WHERE restaurant_id = ?`;
  connection.query(selectQuery, [restaurantId], (error, results) => {
    if (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Error fetching menu items.",
      });
      return;
    }

    const menuItems = results.map((menuItem) => ({
      id: menuItem.id,
      itemName: menuItem.itemName,
      unitPrice: menuItem.unitPrice,
      image: menuItem.image,
    }));

    res.json({
      success: true,
      message: "Menu items fetched successfully.",
      data: menuItems,
    });
  });
});

app.post("/api/getRestaurantMobileNumberUsingId", (req, res) => {
  const id = req.body.id;
  connection.query(
    "SELECT mobileNumber FROM registered_restaurants WHERE id = ?",
    [id],
    (error, results, fields) => {
      if (error) {
        console.log(error);
        res.json({
          success: false,
          message: "Error occurred while getting data from the database.",
        });
      } else if (results.length === 0) {
        console.log("No restaurant with the given id.");
        res.json({
          success: false,
          message: "No restaurant with the given id.",
        });
      } else {
        res.json({
          success: true,
          message: "Successfully fetched mobile number.",
          mobileNumber: results[0].mobileNumber,
          name: results[0].name,
        });
      }
    }
  );
});

calculateTotalPrice = (items) => {
  return items.reduce((total, item) => {
    return total + item.unitPrice * item.quantity;
  }, 0);
};
app.post("/api/submitOrder", (req, res) => {
  const { emailId, password, cart, orderDateTime, restaurantId, mobileNumber } =
    req.body;
  const orderProgress = "Requested";

  if (!emailId && !mobileNumber) {
    return res.json({ message: "Invalid details." });
  }

  if (!orderDateTime) {
    return res.json({
      success: false,
      message: "Please provide a valid date and time.",
    });
  }

  let userId;
  const cartJson = JSON.stringify(cart);

  if (!emailId) {
    connection.query(
      "SELECT id FROM registered_users WHERE mobileNumber = ?",
      [mobileNumber],
      (error, results) => {
        if (error) {
          console.error("Error getting user ID:", error);
          return res.json({
            success: false,
            message: "Error submitting order",
          });
        }

        if (results.length === 0) {
          connection.query(
            "INSERT INTO registered_users (name, emailId, mobileNumber, password) VALUES (?, ?, ?, ?)",
            [mobileNumber, `${mobileNumber}`, mobileNumber, mobileNumber],
            (error, results) => {
              if (error) {
                console.error("Error creating user:", error);
                return res.json({
                  success: false,
                  message: "Error submitting order",
                });
              }

              userId = results.insertId;
              insertOrder();
            }
          );
        } else {
          userId = results[0].id;
          insertOrder();
        }
      }
    );
  } else {
    connection.query(
      "SELECT id FROM registered_users WHERE emailId = ? AND password = ?",
      [emailId, password],
      (error, results) => {
        if (error) {
          console.error("Error getting user ID:", error);
          return res.json({
            success: false,
            message: "Error submitting order",
          });
        }

        if (results.length === 0) {
          return res.json({ message: "Invalid email or password." });
        }

        userId = results[0].id;
        insertOrder();
      }
    );
  }

  function insertOrder() {
    connection.query(
      "INSERT INTO orders (order_dateTime, cart, order_progress, restaurant_id, user_id) VALUES (?, ?, ?, ?, ?)",
      [orderDateTime, cartJson, orderProgress, restaurantId, userId],
      (error, results) => {
        if (error) {
          console.error("Error submitting order:", error);
          return res.json({
            success: false,
            message: "Error submitting order",
          });
        }

        const orderId = results.insertId;

        connection.query(
          "SELECT mobileNumber, upiId FROM registered_restaurants WHERE id = ?",
          [restaurantId],
          (error, result) => {
            if (error) {
              console.error("Error getting restaurant info:", error);
              return res.json({
                success: false,
                message: "Error submitting order",
              });
            }

            return res.json({
              success: true,
              message: "Order placed successfully.",
              mobileNumber: result[0].mobileNumber,
              upiId: result[0].upiId,
              amount: calculateTotalPrice(cart),
              orderId: orderId,
            });
          }
        );
      }
    );
  }
});

app.post("/api/getUserRequestedOrders", (req, res) => {
  const { emailId, password } = req.body;
  // Verify user's emailId and password
  connection.query(
    "SELECT id FROM registered_users WHERE emailId = ? AND password = ?",
    [emailId, password],
    (error, results) => {
      if (error) {
        console.error(`Error fetching user ID: ${error}`);
        res.status(500).json({
          success: false,
          message: "Error fetching user ID",
          data: null,
        });
      } else if (results.length === 0) {
        console.error("Invalid emailId or password");
        res.status(401).json({
          success: false,
          message: "Invalid emailId or password",
          data: null,
        });
      } else {
        const userId = results[0].id;

        // Fetch user's requested orders from the database
        connection.query(
          "SELECT orders.*, registered_restaurants.restaurantName AS restaurant_name FROM orders JOIN registered_restaurants ON orders.restaurant_id = registered_restaurants.id WHERE user_id = ? AND order_progress = ?",
          [userId, "Requested"],
          (error, results) => {
            if (error) {
              console.error(`Error fetching user's requested orders: ${error}`);
              res.status(500).json({
                success: false,
                message: "Error fetching user's requested orders",
                data: null,
              });
            } else {
              const orders = results.map((order) => ({
                orderId: order.id,
                orderDateTime: order.order_datetime,
                orderProgress: order.order_progress,
                restaurantName: order.restaurant_name,
                restaurantId: order.restaurant_id,
                cart: JSON.parse(order.cart),
              }));

              res.status(200).json({
                success: true,
                message: `Fetched ${orders.length} orders for user ${userId}`,
                data: orders.reverse(),
              });
            }
          }
        );
      }
    }
  );
});

app.post("/api/getUserCompletedOrders", (req, res) => {
  const { emailId, password } = req.body;

  // Verify user's emailId and password
  connection.query(
    "SELECT id FROM registered_users WHERE emailId = ? AND password = ?",
    [emailId, password],
    (error, results) => {
      if (error) {
        console.error(`Error fetching user ID: ${error}`);
        res.status(500).json({
          success: false,
          message: "Error fetching user ID",
          data: null,
        });
      } else if (results.length === 0) {
        console.error("Invalid emailId or password");
        res.status(401).json({
          success: false,
          message: "Invalid emailId or password",
          data: null,
        });
      } else {
        const userId = results[0].id;

        // Fetch user's completed orders from the database
        connection.query(
          "SELECT orders.*, registered_restaurants.restaurantName AS restaurant_name FROM orders JOIN registered_restaurants ON orders.restaurant_id = registered_restaurants.id WHERE user_id = ? AND (order_progress = ? OR order_progress = ?)",
          [userId, "Completed", "Rejected"],
          (error, results) => {
            if (error) {
              console.error(`Error fetching user's completed orders: ${error}`);
              res.status(500).json({
                success: false,
                message: "Error fetching user's completed orders",
                data: null,
              });
            } else {
              const orders = results.map((order) => ({
                orderId: order.id,
                orderDateTime: order.order_datetime,
                orderProgress: order.order_progress,
                restaurantName: order.restaurant_name,
                restaurantId: order.restaurant_id,
                cart: JSON.parse(order.cart),
              }));
              res.status(200).json({
                success: true,
                message: `Fetched ${orders.length} completed orders for user ${userId}`,
                data: orders.reverse(),
              });
            }
          }
        );
      }
    }
  );
});

app.post("/api/getUserOngoingOrders", (req, res) => {
  const { emailId, password } = req.body;

  // Verify user's emailId and password
  connection.query(
    "SELECT * FROM registered_users WHERE emailId = ? AND password = ?",
    [emailId, password],
    (error, results) => {
      if (error) {
        console.error(`Error fetching user ID: ${error}`);
        res.status(500).json({
          success: false,
          message: "Error fetching user ID",
          data: null,
        });
      } else if (results.length === 0) {
        console.error("Invalid emailId or password");
        res.status(401).json({
          success: false,
          message: "Invalid emailId or password",
          data: null,
        });
      } else {
        const userId = results[0].id;
        const upiId = results[0].upiId;

        // Fetch ongoing orders from the database for the user
        connection.query(
          "SELECT orders.*, registered_restaurants.restaurantName AS restaurant_name, registered_restaurants.mobileNumber as restaurantMobileNumber FROM orders JOIN registered_restaurants ON orders.restaurant_id = registered_restaurants.id WHERE user_id = ? AND order_progress NOT IN ('Requested', 'Completed', 'Rejected')",
          [userId],
          (error, results) => {
            if (error) {
              console.error(`Error fetching user's ongoing orders: ${error}`);
              res.status(500).json({
                success: false,
                message: "Error fetching user's ongoing orders",
                data: null,
              });
            } else {
              const orders = results.map((order) => ({
                orderId: order.id,
                restaurantName: order.restaurant_name,
                restaurantMobileNumber: order.restaurantMobileNumber,
                orderDateTime: order.order_datetime,
                orderProgress: order.order_progress,
                cart: JSON.parse(order.cart),
              }));

              res.status(200).json({
                success: true,
                message: `Fetched ${orders.length} ongoing orders for user ${userId}`,
                data: orders,
                upiId: upiId,
              });
            }
          }
        );
      }
    }
  );
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Server is listening on ${port} at 0.0.0.0`);
});
