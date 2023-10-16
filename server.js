const express = require('express');
const { generateApiKey } = require('generate-api-key');
const app = express();
const PORT = 3000;
require('dotenv').config();
const { db } = require('./firebase');

//Variables

// Stripe key
const STRIPE_SECRET_KEY = process.env.STRIPE_SK;
// Stripe secret key
const stripe = require('stripe')(STRIPE_SECRET_KEY);
// domain
const DOMAIN = 'http://localhost:3000'
// middleware
app.use(express.static('public'))

//routes

//Get Data
app.get('/api', (req, res) => {
    // receive API key
    const {api_key} = req.query;
    if (!api_key) { return res.sendStatus(403)}
    // example
    res.status(200).json({message: 'You are connected to the API'})
})

// session checkout route based off product
app.post('/create-checkout-session/:product', async (req, res) => {
    // product
    const {product} = req.params;
    // interface
    let mode, price_ID, line_items;

// if product is a subscription type, show the priceID of the subscription page (we created it in stripe)
    if (product === 'sub') {
        // priceID
        price_ID = 'price_1O1qcMJ8tWyUVEW7JsoL3ntJ'
        // payment type
        mode = 'subscription'
        // price
        line_items = [
            {
                // show price ID
                price: price_ID,
            }
        ]
    // if product is a one-time payment, show the priceID of the one-time page (we created it in stripe)
    } else if (product === 'pre') {
        // priceID
        price_ID = 'price_1O1qb6J8tWyUVEW79lHwS5BT'
        // payment type
        mode = 'payment'
        line_items = [
            {
                // display price & how many of them
                price: price_ID,
                quantity: 1
            }
        ]
    // else show error
    } else {
        return res.sendStatus(403)
    }
    // generate API key if they get through
    const newAPIKey = generateApiKey();

    // create customer
    const customer = await stripe.customers.create({
        metadata: {
            APIkey: newAPIKey
        }
    })
    // get customer ID
    const stripeCustomerId = customer.id;
    // create checkout session with customer ID that either takes the user to success of cancel URL page
    const session = await stripe.checkout.sessions.create({
        // customer
        customer: stripeCustomerId,
        // API key generation & payment type
        metadata: {
            APIkey: newAPIKey,
            payment_type: product
        },
        // line items (based of if subscription or one-time payment)
        line_items: line_items,
        // mode type (based on subscription or one time payment)
        mode: mode,
        // URLS if failed or success
        success_url: `${DOMAIN}/success.html?api_key=${newAPIKey}`,
        cancel_url: `${DOMAIN}/cancel.html`
    })
    // data that will be displayed on the page
    const data = {
        APIkey: newAPIKey,
        payment_type: product,
        stripeCustomerId
    }
    // create firebase record based on api key that was generated
    const dbRes = await db.collection('api_keys').doc(newAPIKey).set(data, { merge: true })

    // use webhook to access firebase & ensure that billing is updated. 
    res.redirect(303, session.url)
})


app.listen(PORT, () => {
    `You are connected to port ${PORT}`
})