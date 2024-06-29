import sys
import json

# Function to parse input and simulate voting process
def simulate_election(input_data):
    num_constituencies = input_data['num_constituencies']
    num_parties = input_data['num_parties']
    constituencies = input_data['constituencies']
    parties = input_data['parties']
    votes = input_data['votes']

    # Simulate voting and results
    results = {}
    party_wins = {party: 0 for party in parties}

    for const in constituencies:
        max_votes = 0
        winning_party = None
        for party, vote_count in votes[const].items():
            if vote_count > max_votes:
                max_votes = vote_count
                winning_party = party
        results[const] = winning_party
        party_wins[winning_party] += 1

    # Determine forming party or coalition
    majority = len(constituencies) // 2 + 1
    forming_party = None
    for party, win_count in party_wins.items():
        if win_count >= majority:
            forming_party = party
            break

    if forming_party:
        print(f"{forming_party} forms the government with {party_wins[forming_party]} seats")
    else:
        print("No party achieved a majority. Coalition government required.")

# Main execution
if __name__ == "__main__":
    # Read input data from command-line arguments or stdin
    input_data = json.loads(sys.argv[1]) if len(sys.argv) > 1 else json.loads(sys.stdin.read().strip())

    # Simulate election and print results
    simulate_election(input_data)
