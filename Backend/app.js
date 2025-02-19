const express = require('express');
const app = express();
const mongoose = require('mongoose');
const {User} = require('./Models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const morgan = require('morgan');
const {Product} = require('./Models/Product');
const {Cart, cart} = require("./Models/Cart.js")

//for form method we use middleware 
app.use(express.json())
app.use(cors());
app.use(morgan("dev"));


mongoose.connect('mongodb://127.0.0.1:27017/ecommerceShop')
.then(()=>{
    console.log("DB is connected");
}).catch(()=>{
    console.log("DB is not connected")
})




//task-1 -> route for register
app.post('/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;

        // Check if any field is missing
        if (!email || !password || !name) {
            return res.status(400).json({ message: "Some fields are missing" });
        }

        // Check if the user already exists
        const isUserAlreadyExist = await User.findOne({ email });

        if (isUserAlreadyExist) {
            res.status(400).json({ message: "User already has an account" });
            return;
        }else{
            // Hash the password
             const salt = bcrypt.genSaltSync(10);
            const hashedPassword = bcrypt.hashSync(password, salt);
            // Generate JWT token
            const token = jwt.sign({ email }, "supersecret", { expiresIn: "365d" });

            // Create user in database
            await User.create({
                name,
                email,
                password: hashedPassword,
                token,
                role:"user",
            });
            return res.status(201).json({ message: "User created successfully" });

        }   
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

//task 2 ->route for login
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if email or password is missing
        if (!email || !password) {
            return res.status(400).json({ message: "Email and Password are required" });
        }

        // Find user by email
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: "User is not registered. Please register first." });
        }

        //  Compare the entered password with the stored hashed password
        const isPasswordMatched = bcrypt.compareSync(password, user.password);

        if (!isPasswordMatched) {
            return res.status(400).json({ message: "Password not matched" });
        }

        //  Successful login - Return user data
        return res.status(200).json({
            id: user._id,
            name: user.name,
            token: user.token,
            email: user.email,
            role: user.role,
        });

    } catch (error) {
        console.error("Error during login:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});


//task3 -> get the product
app.get('/products', async(req,res)=>{
    try{
        const products = await Product.find();
        res.status(200).json({
            products:products
        })
    }catch (error) {
        return res.status(500).json({ message: "Internal Server Error" });
    }
})


//task4-> add a product
app.post('/add-product',async(req,res)=>{
    try{
        const body = req.body;
        const name = body.name;
        const { token } = req.headers;
        const decodedtoken = jwt.verify(token, "supersecret");
        // console.log("✌️decodedtoken --->", decodedtoken);
        const user = await User.findOne({ email: decodedtoken.email });
        const description = body.description;
        const image = body.image;
        const price = body.price;
        const brand = body.brand;
        const stock = body.stock;
        /// now we aassuming we hace every thing for product
        await Product.create({
          name: name,
          description: description,
          image: image,
          stock: stock,
          brand: brand,
          price: price,
          user: user._id,
        });
        res.status(201).json({
          message: "Product Created Succesfully",
        });
    
    }catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Internal Server Error" });
    }
})




//task5 -> to show the particular product
app.get('/product/:id', async(req,res)=>{
    try{
        const {id} = req.params;
        if(!id){
            res.status(400).json({message:"Product Id not found"});
        }

        const {token} = req.headers;

        const userEmailFromToken = jwt.verify(token,"supersecret");
        if(userEmailFromToken.email){
            const product = await Product.findById(id);

            if(!product){
                res.status(400).json({message:"Product not found"});
            }

            res.status(200).json({message:"success",product});
        }

    }catch(error){
        console.log(error);
        res.status(500).json({message:"Internal server error"});
    }
})

//task-6 update product
app.patch("/product/edit/:id", async (req, res) => {
    const { id } = req.params;
    const { token } = req.headers;
    const body = req.body.productData;
    const name = body.name;
    const description = body.description;
    const image = body.image;
    const price = body.price;
    const brand = body.brand;
    const stock = body.stock;
    const userEmail = jwt.verify(token, "supersecret");
    try {
      console.log({
        name,
        description,
        image,
        price,
        brand,
        stock,
      });
      if (userEmail.email) {
        const updatedProduct = await Product.findByIdAndUpdate(id, {
          name,
          description,
          image,
          price,
          brand,
          stock,
        });
        res.status(200).json({ message: "Product Updated Succesfully" });
      }
    } catch (error) {
      res.status(400).json({
        message: "Internal Server Error Occured While Updating Product",
      });
    }
  });

// 
// Task7 => Delete product
app.delete("/product/delete/:id",async(req,res) => {
    try{
         const {id} = req.params;
         if(!id) 
         {
            res.status(400).json({message:"Product Id is not Found"});
         }
         const deleteProduct = await Product.findByIdAndDelete(id)

         if(!deleteProduct)
         {
            res.status(404).json({message:"Product not found"})
         }
         else
         {
            res.status(200).json({
                message : "Product Deleted",
                product : deleteProduct,
                   
                
            })
            // alert("Product deleted")   
         }

    }catch(err)
    {
        console.log("Error Occured",err);
        res.status(500).json({message:"Error Occured",err})
        
    }
})

// End of restfull API

// Search section
app.get('/product/search/:keyword',async(req,res) => {
    const {keyword} = req.params;
    try
    {
        const  product = await Product.find({
      
            name : {$regex:keyword , $options : "i"}

        })
        if(product.length === 0)
        {
            return res.status(404).json({message:"No product Found"})
        }

        res.status(200).json({message:"Product Found",
               product:product
        })      

    }
    catch(error){
        console.log("Error Occured",error);
        res.status(500).json({message:"Error cccuring while carting"})
        
    }
})

// Task9 :> creating cart Router

app.get('/cart',async(req,res) => {
    const {token} = req.headers;
    const decodedToken = jwt.verify(token,"supersecret")
    const user = await User.findOne({email : decodedToken.email}).populate({
        // populate => to check nested Schema
        path : "cart",
        populate : {
            path : "products",
            model : 'Product'
        }
    })
    if (!user) {
        return res.status(400).json({message:"User Not Found"})
    }
    res.status(200).json({cart:user.cart})
})
// task10 => to send the carted data

app.post('/cart/add',async(req,res) => {
    const body = req.body;
    const productArray = body.products;
    let totalPrice = 0;
    try{
    //   to iterate over the object id
      for(let item of products) {
        const product = await Product.findById(item);
          
        if(product.price)
        {
            totalPrice += product.price
        }
      }
      const {token} = req.headers;
      const decodedtoken = jwt.verify(token,"supersecret");
      const user = await User.findOne({email : decodedtoken.email})
      let cart;
      if (!user) {
        res.status(404).json({message:"user not found"})
      }
      
     if(user.cart)
      {
        cart = await Cart.findById(user.cart).populate("products")
        // it gives a new array
        const existingProductIds = cart.products.map((*product) => {
            product._id.toString()
        })
        products.forEach(async(productId) => {
            if(!existingProductIds.includes(productId))
            {
                cart.products.push(productId)
                const product = await Product.findById(productId);
                totalPrice += product.price;
            }
        })
        cart.total = totalPrice;
        await cart.save();
      }
      else
      {
        cart = new Cart({
            products:productArray,
            total : totalPrice

        })
        await Cart.save();
        user.cart = cart._id;
        await User.save();
      }

      res.status(201).json({message:"Cart updated",
        cart : cart
      })
    }catch(err){
        console.log("Error Occured",err);
        
    }
})
let PORT = 8080;
app.listen(PORT,()=>{
    console.log(`server is connected to ${PORT}`);
})