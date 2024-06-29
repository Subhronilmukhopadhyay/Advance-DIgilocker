import sys
import time

constituencies = []
num_constituencies = int(input("Enter the number of constituencies: "))

for i in range(num_constituencies):
    const = input(f"Enter the name of constituency {i + 1}: ")
    constituencies.append(const)

parties = []
num_parties = int(input("Enter the number of parties: "))

for i in range(num_parties):
    party = input(f"Enter the name of party {i + 1}: ")
    parties.append(party)

print("\nPolling and Voting:")

votes = {const: {party: 0 for party in parties} for const in constituencies}

for const in constituencies:
    print(f"\nEnter votes for {const}:")
    for party in parties:
        votes[const][party] = int(input(f"Enter the number of votes for {party}: "))

print("\nCounting Votes and Results:")
results = {}

for const in constituencies:
    print(f"\nResults for {const}:")
    max_votes = 0
    winning_party = None
    for party, vote_count in votes[const].items():
        print(f"{party}: {vote_count} votes")
        if vote_count > max_votes:
            max_votes = vote_count
            winning_party = party
    results[const] = winning_party
    print(f"Winning Party in {const}: {winning_party}")

print("\nFormation of Government:")
party_wins = {party: 0 for party in parties}

for const, winner in results.items():
    party_wins[winner] += 1

for party, win_count in party_wins.items():
    print(f"{party} won {win_count} constituencies")

majority = len(constituencies) // 2 + 1
forming_party = None
for party, win_count in party_wins.items():
    if win_count >= majority:
        forming_party = party
        break

if forming_party:
    print(f"\n{forming_party} forms the government with {party_wins[forming_party]} seats")
else:
    print("\nNo party achieved a majority. Coalition government required.")

