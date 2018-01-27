# chef-lex
A trainings chat bot build on the Amazon Lex platform
The running example can be found on the [github pages](https://hannes-hochreiner.github.io/chef-lex/)

# prerequisites
  * AWS account

# steps
I started out following the [AWS blog entry](https://aws.amazon.com/blogs/machine-learning/greetings-visitor-engage-your-web-users-with-amazon-lex/) for setting up a chat bot on ones website.
However, I wanted to implement the logic on the site itself (not in a lambda function).
Hence, I had to modify the example slightly.

## Cognito
I started by setting up a new user pool as described in the blog post.
Unfortunately, the interface seemed to have evolved somewhat.
I could not find an option for anonymous login anymore, so I created a "standard" user pool.

## IAM
I created a new role with cognito as the identity provider and the policy "AmazonLexRunBotsOnly".

## website
Next, I copied over the example website.
I was positive it would not work, as I could not allow anonymous access to the user pool.
