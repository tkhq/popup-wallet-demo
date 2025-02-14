require 'sinatra/base'
require 'httparty'
require 'json'
require "jwt"

SECRET_KEY = "my_shared_secret"
class App < Sinatra::Base
  get '/' do
    content_type :json
    { message: 'Hello from Ruby Backend!' }.to_json
  end

  post '/authenticate' do
    body = JSON.parse(request.body.read)
    jwt = body["jwt"]

    begin
      # Decode the JWT
      decoded_token = JWT.decode(jwt, SECRET_KEY, true, { algorithm: "HS256" })
      puts "decoded_token: #{decoded_token}"
      payload = decoded_token[0]
  
      # Extract organizationId from the token
      organization_id = payload["organizationId"]
      user_id = payload["userId"]

      puts "organization_id: #{organization_id} user_id: #{user_id}"
  
      # Simulate a user lookup (replace with real database logic)
      user_details = {
        organizationId: organization_id,
        userId: user_id,
        name: "John Doe",
        email: "john.doe@example.com"
      }
  
      status 200
      user_details.to_json
    rescue JWT::DecodeError => e
      status 401
      { error: "Invalid or expired token" }.to_json
    end
  end
end 