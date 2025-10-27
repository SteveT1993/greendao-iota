#!/bin/bash


# Ensure /usr/bin is in PATH for jq
export PATH=$PATH:/usr/bin

# Load environment variables from .env file
if [ -f .env ]; then
  source .env
else
  echo ".env file not found!"
  exit 1
fi



# List all available public keys using keytool list
echo "Listing all available public keys:"
iota keytool list
echo



# Use public key and IOTA address from .env if available
if [ -z "$PUBLIC_KEY" ]; then
  read -p "Enter your public key: " pk
else
  pk="$PUBLIC_KEY"
  echo "Using PUBLIC_KEY from .env: $pk"
fi
if [ -z "$IOTA_ADDRESS" ]; then
  read -p "Enter your IOTA address: " iota_address
else
  iota_address="$IOTA_ADDRESS"
  echo "Using IOTA_ADDRESS from .env: $iota_address"
fi
public_keys=("$pk")
weights=("1")
iota_addresses=("$iota_address")
threshold=1


# For single-sig, admin address is just your IOTA address
MULTISIG_ADMIN_ADDRESS=$iota_address
echo "- Admin Address is: ${MULTISIG_ADMIN_ADDRESS}"

# Optional: Request tokens from the faucet (for testing purposes)
echo "Requesting tokens from faucet..."
faucet_res=""
attempt=0
max_attempts=5

# Loop to check the faucet response
while [[ "$faucet_res" == "" && $attempt -lt $max_attempts ]]; do
  attempt=$((attempt + 1))
  faucet_res=$(curl --location --request POST "${IOTA_FAUCET}" --header 'Content-Type: application/json' --data-raw "{ \"FixedAmountRequest\": { \"recipient\": \"$MULTISIG_ADMIN_ADDRESS\" } }")
  
  # Check for successful response
  if echo "$faucet_res" | grep -q "error"; then
    echo "Faucet request failed: $faucet_res"
    echo "Retrying... attempt $attempt of $max_attempts"
    faucet_res=""
    sleep 1 # wait before retrying
  fi
done

# Check if faucet request was successful
if [[ "$faucet_res" == "" ]]; then
  echo "Failed to request tokens from faucet after $max_attempts attempts."
else
  echo "Faucet request succeeded."
fi

# Run the transfer command
echo "Running transfer command..."
tx_bytes=$(iota client publish --skip-fetch-latest-git-deps --gas-budget 2000000000 ${MOVE_PACKAGE_PATH} --skip-dependency-verification --serialize-unsigned-transaction)

echo "Raw tx_bytes to execute: $tx_bytes"


# Ask the user to input the signature for your IOTA address
read -p "Enter the signature for your address $iota_address: " multisig_serialized


# Execute a transaction with your single signature
execute_res=$(iota client execute-signed-tx --tx-bytes "$tx_bytes" --signatures "$multisig_serialized")

# Save the publish result
echo "$execute_res" > .publish.res.json

# Check if the publish command succeeded
if [[ "$execute_res" =~ "error" ]]; then
  echo "Error during move contract publishing. Details: $execute_res"
  exit 1
fi

# Extract the Package ID from the publish response
publishedObjs=$(echo "$execute_res" | jq -r '.objectChanges[] | select(.type == "published")')
PACKAGE_ID=$(echo "$publishedObjs" | jq -r '.packageId')

# Update the .env file with the new Package ID
cat > .env <<-API_ENV
IOTA_NETWORK=$IOTA_NETWORK
IOTA_FAUCET=$IOTA_FAUCET
MOVE_PACKAGE_PATH=$MOVE_PACKAGE_PATH
PACKAGE_ADDRESS=$PACKAGE_ID
MULTISIG_ADMIN_ADDRESS=$MULTISIG_ADMIN_ADDRESS
API_ENV

echo "Contract Deployment finished!"
echo "Package ID: $PACKAGE_ID"