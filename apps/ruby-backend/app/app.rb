require 'sinatra/base'
require 'httparty'
require 'json'

class App < Sinatra::Base
  get '/' do
    content_type :json
    { message: 'Hello from Ruby Backend!' }.to_json
  end

  post '/authenticate' do
    # Read the request body directly without rewinding
    signed_request = JSON.parse(request.body.read)

    # Forward the request to Turnkey for authentication
    response = HTTParty.post(
      signed_request['url'],
      body: signed_request['body'],
      headers: {
        'Content-Type' => 'application/json',
        signed_request['stamp']['stampHeaderName'] => signed_request['stamp']['stampHeaderValue']
      }
    )

    if response.code == 200
      # User authenticated successfully

      # Parse the Turnkey response and return the full result
      result = JSON.parse(response.body)
      puts "Successful authentication. OrganizationId: #{result['organizationId']}, UserId: #{result['userId']}"

      # Here you may do your database lookup to get the rest of the user's data from your database

      # Return the full result from the Turnkey response
      status 200
      result.to_json
    else
      status 404
      { error: 'User not authenticated' }.to_json
    end
  end
end 