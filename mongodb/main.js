import mongoose from "mongoose";
import {faker} from "@faker-js/faker"

mongoose.connect("mongodb://localhost:27017/nosql")

// Define the Post schema
const postSchema = new mongoose.Schema({
    content: { type: String, required: true }, // Main content of the post
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    likes: { type: Number, default: 0 },
    retweets: { type: Number, default: 0 },
    replies: { type: Number, default: 0 },
    hashtags: [String],
    mentions: [String],
    media: [String], // URLs to images/videos
    isPinned: { type: Boolean, default: false },
    isReply: { type: Boolean, default: false },
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' }, // Reference to another post
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to User
    visibility: { type: String, enum: ['public', 'private', 'followers'], default: 'public' },
    location: String,
    tags: [String]
});

// Define the Payment schema
const paymentSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to User
    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    paymentDate: { type: Date, default: Date.now },
    paymentMethod: { type: String, enum: ['credit_card', 'paypal', 'bank_transfer'], required: true },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' }
});

// Define the User schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    firstName: { type: String },
    lastName: { type: String },
    bio: { type: String },
    profilePicture: { type: String }, // URL to profile picture
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }], // Reference to Posts
    payments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Payment' }] // Reference to Payments
});

// Create models
const User = mongoose.model('User', userSchema);
const Post = mongoose.model('Post', postSchema);
const Payment = mongoose.model('Payment', paymentSchema);

(async () => {
		const users = [];
		for (let i = 1; i <= 10; i++) {
			const user = {
				username: faker.internet.displayName(),
				email: faker.internet.email(),
				password: faker.internet.password(),
				firstName: faker.person.firstName(),
				lastName: faker.person.lastName(),
				bio: faker.person.bio(),
				profilePicture: faker.image.avatar(),
				followers: [],
				following: [],
				createdAt: new Date(),
				updatedAt: new Date(),
				posts: [],
				payments: [],
			};
			const insertedUser = User.insertOne(user);
			users.push(insertedUser.insertedId);
		}
        console.log({users});


		// Insert 10 posts and associate them with random users
		const posts = [];
		for (let i = 1; i <= 10; i++) {
			const post = {
				content: faker.lorem.lines(Math.floor(Math.random() * 5)),
				createdAt: new Date(),
				updatedAt: new Date(),
				likes: Math.floor(Math.random() * 100),
				retweets: Math.floor(Math.random() * 50),
				replies: Math.floor(Math.random() * 20),
				hashtags: [`#hashtag${i}`],
				mentions: faker.word
					.words(Math.floor(Math.random() * 10))
					.split(" "),
				media: [faker.image.avatar()],
				isPinned: false,
				isReply: false,
				replyTo: null,
				author: users[Math.floor(Math.random() * users.length)],
				visibility: "public",
				location: faker.location.streetAddress({
					useFullAddress: true,
				}),
				tags: faker.word
					.words(Math.floor(Math.random() * 15))
					.split(" "),
			};
			const insertedPost = Post.insertOne(post);
			posts.push(insertedPost.insertedId);
		}

		// Update users with their posts
		posts.forEach((postId, index) => {
			User.updateOne(
				{ _id: posts[index].author },
				{ $push: { posts: postId } },
			);
		});

		// Insert payments and associate them with random users
		for (let i = 1; i <= 10; i++) {
			const payment = {
				user: users[Math.floor(Math.random() * users.length)],
				amount: Math.floor(Math.random() * 500) + 50,
				currency: "USD",
				paymentDate: new Date(),
				paymentMethod: ["credit_card", "paypal", "bank_transfer"][
					Math.floor(Math.random() * 3)
				],
				status: ["pending", "completed", "failed"][
					Math.floor(Math.random() * 3)
				],
			};
			const insertedPayment = await Payment.insertOne(payment);

			// Update the user with the payment
			User.updateOne(
				{ _id: payment.user },
				{ $push: { payments: insertedPayment.insertedId } },
			);
		}
	}
)();
