	module 0x0::dao {

		use std::string;
		use iota::table;
		use iota::event;

	/// DAO Structs
	public struct DaoURI has key, store {
		id: object::UID,
		dao_id: u64,
		dao_wallet: string::String,
		dao_uri: string::String,
		finished: bool,
		template: string::String
	}

	public struct GoalURI has key, store {
		id: object::UID,
		goal_id: u64,
		dao_id: u64,
		goal_uri: string::String
	}

	public struct IdeasURI has key, store {
		id: object::UID,
		ideas_id: u64,
		goal_id: u64,
		ideas_uri: string::String,
		donation: u64
	}

	public struct Donation has key, store {
		id: object::UID,
		donation_id: u64,
		ideas_id: u64,
		wallet: string::String,
		donation: u64
	}

	public struct Join has store {
		id: object::UID,
		join_id: u64,
		dao_id: u64,
		wallet: string::String
	}

	public struct UserBadge has key, store {
		id: object::UID,
		wallet: string::String,
		dao: bool,
		joined: bool,
		goal: bool,
		ideas: bool,
		vote: bool,
		donation: bool,
		comment: bool,
		reply: bool
	}

	public struct Vote has store {
		id: object::UID,
		vote_id: u64,
		goal_id: u64,
		ideas_id: u64,
		voter: string::String
	}

	// Align Message with Solidity: include sender (no date)
	public struct Message has store {
		id: object::UID,
		message_id: u64,
		ideas_id: u64,
		message: string::String,
		sender: string::String
	}

	// Align Reply with Solidity: include ideas_id, no address/date
	public struct Reply has store {
		id: object::UID,
		reply_id: u64,
		message_id: u64,
		ideas_id: u64,
		message: string::String
	}

	/// Events
	public struct DaoRetrieved has copy, drop {
		id: u64,
		dao_wallet: string::String,
		dao_uri: string::String,
		finished: bool,
		template: string::String
	}

	public struct GoalRetrieved has copy, drop {
		id: u64,
		dao_id: u64,
		goal_uri: string::String
	}

	public struct IdeasRetrieved has copy, drop {
		id: u64,
		goal_id: u64,
		ideas_uri: string::String,
		donation: u64
	}

	public struct DonationRetrieved has copy, drop {
		id: u64,
		ideas_id: u64,
		wallet: string::String,
		donation: u64
	}

	public struct JoinRetrieved has copy, drop {
		id: u64,
		dao_id: u64,
		wallet: string::String
	}

	public struct UserBadgeRetrieved has copy, drop {
		wallet: string::String,
		dao: bool,
		joined: bool,
		goal: bool,
		ideas: bool,
		vote: bool,
		donation: bool,
		comment: bool,
		reply: bool
	}

	public struct AllDaosRetrieved has copy, drop {
		daos: vector<DaoRetrieved>
	}

	public struct GoalsForDaoRetrieved has copy, drop {
		dao_id: u64,
		goals: vector<GoalRetrieved>
	}

	public struct IdeasForGoalRetrieved has copy, drop {
		goal_id: u64,
		ideas: vector<IdeasRetrieved>
	}

	public struct DonationsForIdeaRetrieved has copy, drop {
		ideas_id: u64,
		donations: vector<DonationRetrieved>
	}

	public struct JoinsForDaoRetrieved has copy, drop {
		dao_id: u64,
		joins: vector<JoinRetrieved>
	}

	/// Storage
	public struct State has key {
		id: object::UID,
		dao_counter: u64,
		goal_counter: u64,
		ideas_counter: u64,
		join_counter: u64,
		donation_counter: u64,
		vote_counter: u64,
		message_counter: u64,
		reply_counter: u64,
		daos: table::Table<u64, DaoURI>,
		goals: table::Table<u64, GoalURI>,
		ideas: table::Table<u64, IdeasURI>,
		joins: table::Table<u64, Join>,
		donations: table::Table<u64, Donation>,
		votes: table::Table<u64, Vote>,
		messages: table::Table<u64, Message>,
		replies: table::Table<u64, Reply>,
		user_badges: table::Table<string::String, UserBadge>
	}

	/// Initialization
	fun init(ctx: &mut tx_context::TxContext): () {
		let daos = table::new(ctx);
		let goals = table::new(ctx);
		let ideas = table::new(ctx);
		let joins = table::new(ctx);
		let donations = table::new(ctx);
		let votes = table::new(ctx);
		let messages = table::new(ctx);
		let replies = table::new(ctx);
		let user_badges = table::new(ctx);


		let state = State {
			id: object::new(ctx),
			dao_counter: 0,
			goal_counter: 0,
			ideas_counter: 0,
			join_counter: 0,
			donation_counter: 0,
			vote_counter: 0,
			message_counter: 0,
			reply_counter: 0,
			daos: daos,
			goals: goals,
			ideas: ideas,
			joins: joins,
			donations: donations,
			votes: votes,
			messages: messages,
			replies: replies,
			user_badges: user_badges
		};
		transfer::share_object(state);
	}

	/// Create DAO
	public fun create_dao(
		state: &mut State,
		dao_wallet: vector<u8>,
		dao_uri: vector<u8>,
		template: vector<u8>,
		ctx: &mut tx_context::TxContext
	): u64 {
		let id = state.dao_counter;
		let dao_wallet_str = string::utf8(dao_wallet);
		let dao_uri_str = string::utf8(dao_uri);
		let template_str = string::utf8(template);
		let dao = DaoURI {
			id: iota::object::new(ctx),
			dao_id: id,
			dao_wallet: dao_wallet_str,
			dao_uri: dao_uri_str,
			finished: false,
			template: template_str
		};
		
		table::add(&mut state.daos, id, dao);
		// Update badge
		if (table::contains(&state.user_badges, dao_wallet_str)) {
			let b = table::borrow_mut(&mut state.user_badges, dao_wallet_str);
			b.dao = true;
		} else {
			let badge = UserBadge {
				id: iota::object::new(ctx),
				wallet: dao_wallet_str,
				dao: true,
				joined: false,
				goal: false,
				ideas: false,
				vote: false,
				donation: false,
				comment: false,
				reply: false
			};
				table::add(&mut state.user_badges, dao_wallet_str, badge);
			};
		state.dao_counter = state.dao_counter + 1;
		state.dao_counter
	}

	/// Create Goal
	public fun create_goal(
		state: &mut State,
		goal_uri: vector<u8>,
		dao_id: u64,
		wallet: vector<u8>,
		ctx: &mut tx_context::TxContext
	): u64 {
		let id = state.goal_counter;
		let goal_uri_str = string::utf8(goal_uri);
		let wallet_str = string::utf8(wallet);
		let goal = GoalURI {
			id: iota::object::new(ctx),
			goal_id: id,
			dao_id,
			goal_uri: goal_uri_str
		};
		table::add(&mut state.goals, id, goal);
		// Update badge
		if (table::contains(&state.user_badges, wallet_str)) {
			let b = table::borrow_mut(&mut state.user_badges, wallet_str);
			b.goal = true;
		} else {
			let badge = UserBadge {
				id: iota::object::new(ctx),
				wallet: wallet_str,
				dao: false,
				joined: false,
				goal: true,
				ideas: false,
				vote: false,
				donation: false,
				comment: false,
				reply: false
			};
			table::add(&mut state.user_badges, wallet_str, badge);
		};
	state.goal_counter = state.goal_counter + 1;
		state.goal_counter
	}

	/// Create Ideas
	public fun create_ideas(
		state: &mut State,
		ideas_uri: vector<u8>,
		goal_id: u64,
		wallet: vector<u8>,
		ctx: &mut tx_context::TxContext
	): u64 {
		let id = state.ideas_counter;
		let ideas_uri_str = string::utf8(ideas_uri);
		let wallet_str = string::utf8(wallet);
		let ideas = IdeasURI {
			id: iota::object::new(ctx),
			ideas_id: id,
			goal_id,
			ideas_uri: ideas_uri_str,
			donation: 0
		};
		table::add(&mut state.ideas, id, ideas);
		// Update badge
		if (table::contains(&state.user_badges, wallet_str)) {
			let b = table::borrow_mut(&mut state.user_badges, wallet_str);
			b.ideas = true;
		} else {
			let badge = UserBadge {
				id: iota::object::new(ctx),
				wallet: wallet_str,
				dao: false,
				joined: false,
				goal: false,
				ideas: true,
				vote: false,
				donation: false,
				comment: false,
				reply: false
			};
			table::add(&mut state.user_badges, wallet_str, badge);
		};
	state.ideas_counter = state.ideas_counter + 1;
		state.ideas_counter
	}

	/// Add Donation
	public fun add_donation(
		state: &mut State,
		ideas_id: u64,
		donation: u64,
		donator: vector<u8>,
		ctx: &mut tx_context::TxContext
	) {
		let id = state.donation_counter;
		let donator_str = string::utf8(donator);
		let d = Donation {
			id: iota::object::new(ctx),
			donation_id: id,
			ideas_id,
			wallet: donator_str,
			donation
		};
		table::add(&mut state.donations, id, d);
		// Update badge
		if (table::contains(&state.user_badges, donator_str)) {
			let b = table::borrow_mut(&mut state.user_badges, donator_str);
			b.donation = true;
		} else {
			let badge = UserBadge {
				id: iota::object::new(ctx),
				wallet: donator_str,
				dao: false,
				joined: false,
				goal: false,
				ideas: false,
				vote: false,
				donation: true,
				comment: false,
				reply: false
			};
			table::add(&mut state.user_badges, donator_str, badge);
		};
	state.donation_counter = state.donation_counter + 1;
	}

	/// Join Community
	public fun join_community(
		state: &mut State,
		dao_id: u64,
		person: vector<u8>,
		ctx: &mut tx_context::TxContext
	) {
		let id = state.join_counter;
		let person_str = string::utf8(person);
		let join = Join {
			id: iota::object::new(ctx),
			join_id: id,
			dao_id,
			wallet: person_str
		};
		table::add(&mut state.joins, id, join);
		// Update badge
		if (table::contains(&state.user_badges, person_str)) {
			let b = table::borrow_mut(&mut state.user_badges, person_str);
			b.joined = true;
		} else {
			let badge = UserBadge {
				id: iota::object::new(ctx),
				wallet: person_str,
				dao: false,
				joined: true,
				goal: false,
				ideas: false,
				vote: false,
				donation: false,
				comment: false,
				reply: false
			};
			table::add(&mut state.user_badges, person_str, badge);
		};
	state.join_counter = state.join_counter + 1;
	}

	/// Create Goal Ideas Vote
	public fun create_goal_ideas_vote(
		state: &mut State,
		goal_id: u64,
		ideas_id: u64,
		voter: vector<u8>,
		ctx: &mut tx_context::TxContext
	) {
		let id = state.vote_counter;
		let voter_str = string::utf8(voter);
		let vote = Vote {
			id: iota::object::new(ctx),
			vote_id: id,
			goal_id,
			ideas_id,
			voter: voter_str
		};
		table::add(&mut state.votes, id, vote);
		// Update badge
		if (table::contains(&state.user_badges, voter_str)) {
			let b = table::borrow_mut(&mut state.user_badges, voter_str);
			b.vote = true;
		} else {
			let badge = UserBadge {
				id: iota::object::new(ctx),
				wallet: voter_str,
				dao: false,
				joined: false,
				goal: false,
				ideas: false,
				vote: true,
				donation: false,
				comment: false,
				reply: false
			};
			table::add(&mut state.user_badges, voter_str, badge);
		};
		state.vote_counter = state.vote_counter + 1;
	}

	/// Send Message (align with Solidity: sender, no date)
	public fun sendMsg(
		state: &mut State,
		ideas_id: u64,
		message: vector<u8>,
		sender: vector<u8>,
		ctx: &mut tx_context::TxContext
	): u64 {
		let id = state.message_counter;
		let message_str = string::utf8(message);
		let sender_str = string::utf8(sender);
		let msg = Message {
			id: iota::object::new(ctx),
			message_id: id,
			ideas_id,
			message: message_str,
			sender: sender_str
		};
		table::add(&mut state.messages, id, msg);
		// Update badge
		if (table::contains(&state.user_badges, sender_str)) {
			let b = table::borrow_mut(&mut state.user_badges, sender_str);
			b.comment = true;
		} else {
			let badge = UserBadge {
				id: iota::object::new(ctx),
				wallet: sender_str,
				dao: false,
				joined: false,
				goal: false,
				ideas: false,
				vote: false,
				donation: false,
				comment: true,
				reply: false
			};
			table::add(&mut state.user_badges, sender_str, badge);
		};
		state.message_counter = state.message_counter + 1;
		id
	}

	/// Send Reply (align with Solidity: wallet and ideas_id)
	public fun sendReply(
		state: &mut State,
		message_id: u64,
		message: vector<u8>,
		wallet: vector<u8>,
		ideas_id: u64,
		ctx: &mut tx_context::TxContext
	): u64 {
		let id = state.reply_counter;
		let message_str = string::utf8(message);
		let wallet_str = string::utf8(wallet);
		let reply = Reply {
			id: iota::object::new(ctx),
			reply_id: id,
			message_id,
			ideas_id,
			message: message_str
		};
		table::add(&mut state.replies, id, reply);
		// Update badge
		if (table::contains(&state.user_badges, wallet_str)) {
			let b = table::borrow_mut(&mut state.user_badges, wallet_str);
			b.reply = true;
		} else {
			let badge = UserBadge {
				id: iota::object::new(ctx),
				wallet: wallet_str,
				dao: false,
				joined: false,
				goal: false,
				ideas: false,
				vote: false,
				donation: false,
				comment: false,
				reply: true
			};
		table::add(&mut state.user_badges, wallet_str, badge);
	};
	state.reply_counter = state.reply_counter + 1;
		id
	}	/// Get DAO by id
	public fun get_dao(state: &State, id: u64, ctx: &mut tx_context::TxContext) {
		let dao = table::borrow(&state.daos, id);
		event::emit(DaoRetrieved {
			id,
			dao_wallet: dao.dao_wallet,
			dao_uri: dao.dao_uri,
			finished: dao.finished,
			template: dao.template
		});
	}

	/// Get Goal by id
	public fun get_goal(state: &State, id: u64, ctx: &mut tx_context::TxContext) {
		let goal = table::borrow(&state.goals, id);
		event::emit(GoalRetrieved {
			id,
			dao_id: goal.dao_id,
			goal_uri: goal.goal_uri
		});
	}

	/// Get Ideas by id
	public fun get_ideas(state: &State, id: u64, ctx: &mut tx_context::TxContext) {
		let ideas = table::borrow(&state.ideas, id);
		event::emit(IdeasRetrieved {
			id,
			goal_id: ideas.goal_id,
			ideas_uri: ideas.ideas_uri,
			donation: ideas.donation
		});
	}

	/// Get Donation by id
	public fun get_donation(state: &State, id: u64, ctx: &mut tx_context::TxContext) {
		let d = table::borrow(&state.donations, id);
		event::emit(DonationRetrieved {
			id,
			ideas_id: d.ideas_id,
			wallet: d.wallet,
			donation: d.donation
		});
	}

	/// Get Join by id
	public fun get_join(state: &State, id: u64, ctx: &mut tx_context::TxContext) {
		let j = table::borrow(&state.joins, id);
		event::emit(JoinRetrieved {
			id,
			dao_id: j.dao_id,
			wallet: j.wallet
		});
	}

	/// Update template for a DAO
	public fun update_template(
		state: &mut State,
		id: u64,
		template: vector<u8>,
		ctx: &mut tx_context::TxContext
	) {
		let template_str = string::utf8(template);
		let dao = table::borrow_mut(&mut state.daos, id);
		dao.template = template_str;
		// Emit the DaoRetrieved event with updated template
		event::emit(DaoRetrieved {
			id,
			dao_wallet: dao.dao_wallet,
			dao_uri: dao.dao_uri,
			finished: dao.finished,
			template: dao.template
		});
	}

	/// Get UserBadge by wallet string
	public fun get_user_badge(state: &State, wallet: vector<u8>, ctx: &mut tx_context::TxContext) {
		let wallet_str = string::utf8(wallet);
		let b = table::borrow(&state.user_badges, wallet_str);
		event::emit(UserBadgeRetrieved {
			wallet: b.wallet,
			dao: b.dao,
			joined: b.joined,
			goal: b.goal,
			ideas: b.ideas,
			vote: b.vote,
			donation: b.donation,
			comment: b.comment,
			reply: b.reply
		});
	}

	/// View all DAOs (returns vector of DaoInfo)
	public fun view_all_daos(state: &State, ctx: &mut tx_context::TxContext) {
		let mut daos = vector::empty<DaoRetrieved>();
		let mut i = 0;
		while (i < state.dao_counter) {
			if (table::contains(&state.daos, i)) {
				let dao = table::borrow(&state.daos, i);
				vector::push_back(&mut daos, DaoRetrieved {
					id: i,
					dao_wallet: dao.dao_wallet,
					dao_uri: dao.dao_uri,
					finished: dao.finished,
					template: dao.template
				});
			};
			i = i + 1;
		};
		event::emit(AllDaosRetrieved { daos });
	}

	/// View goals for a DAO
	public fun view_goals_for_dao(state: &State, dao_id: u64, ctx: &mut tx_context::TxContext) {
		let mut goals = vector::empty<GoalRetrieved>();
		let mut i = 0;
		while (i < state.goal_counter) {
			if (table::contains(&state.goals, i)) {
				let goal = table::borrow(&state.goals, i);
				if (goal.dao_id == dao_id) {
					vector::push_back(&mut goals, GoalRetrieved {
						id: i,
						dao_id: goal.dao_id,
						goal_uri: goal.goal_uri
					});
				};
			  };
			  i = i + 1;
		  };
		  event::emit(GoalsForDaoRetrieved { dao_id, goals });
	}

	/// View ideas for a goal
	public fun view_ideas_for_goal(state: &State, goal_id: u64, ctx: &mut tx_context::TxContext) {
		let mut ideas = vector::empty<IdeasRetrieved>();
		let mut i = 0;
		while (i < state.ideas_counter) {
			if (table::contains(&state.ideas, i)) {
				let idea = table::borrow(&state.ideas, i);
				if (idea.goal_id == goal_id) {
					vector::push_back(&mut ideas, IdeasRetrieved {
						id: i,
						goal_id: idea.goal_id,
						ideas_uri: idea.ideas_uri,
						donation: idea.donation
					});
				};
			  };
			  i = i + 1;
		  };
		  event::emit(IdeasForGoalRetrieved { goal_id, ideas });
	}

	/// View donations for an idea
	public fun view_donations_for_idea(state: &State, ideas_id: u64, ctx: &mut tx_context::TxContext) {
		let mut donations = vector::empty<DonationRetrieved>();
		let mut i = 0;
		while (i < state.donation_counter) {
			if (table::contains(&state.donations, i)) {
				let d = table::borrow(&state.donations, i);
				if (d.ideas_id == ideas_id) {
					vector::push_back(&mut donations, DonationRetrieved {
						id: i,
						ideas_id: d.ideas_id,
						wallet: d.wallet,
						donation: d.donation
					});
				};
			  };
			  i = i + 1;
		  };
		  event::emit(DonationsForIdeaRetrieved { ideas_id, donations });
	}

	/// View functions
	public fun goal_uri(state: &State, id: u64): string::String {
		let goal = table::borrow(&state.goals, id);
		goal.goal_uri
	}

	public fun ideas_uri(state: &State, id: u64): string::String {
		let ideas = table::borrow(&state.ideas, id);
		ideas.ideas_uri
	}

	  public fun get_all_ideas_by_goal_id(state: &State, goal_id: u64): vector<string::String> {
		  let mut uris = vector::empty<string::String>();
		  let mut i = 0;
		  while (i < state.ideas_counter) {
			  if (table::contains(&state.ideas, i)) {
				  let idea = table::borrow(&state.ideas, i);
				  if (idea.goal_id == goal_id) {
					  vector::push_back(&mut uris, idea.ideas_uri);
				  };
			  };
			  i = i + 1;
		  };
		  uris
	  }

	public fun get_ideas_id_by_ideas_uri(state: &State, uri: string::String): u64 {
			  let mut i = 0;
			  while (i < state.ideas_counter) {
				  if (table::contains(&state.ideas, i)) {
					  let idea = table::borrow(&state.ideas, i);
					  if (idea.ideas_uri == uri) {
						  return i
					  };
				  };
				  i = i + 1;
			  };
			  0
		}

	public fun get_goal_id_from_ideas_uri(state: &State, uri: string::String): u64 {
		let mut i = 0;
		while (i < state.ideas_counter) {
			if (table::contains(&state.ideas, i)) {
				let idea = table::borrow(&state.ideas, i);
				if (idea.ideas_uri == uri) {
					return idea.goal_id
				};
			};
			i = i + 1;
		};
		0
	}

	public fun get_ideas_donation(state: &State, id: u64): u64 {
		let ideas = table::borrow(&state.ideas, id);
		ideas.donation
	}

	public fun get_ideas_votes_from_goal(state: &State, goal_id: u64, ideas_id: u64): vector<string::String> {
		let mut voters = vector::empty<string::String>();
		let mut i = 0;
		  while (i < state.vote_counter) {
			  if (table::contains(&state.votes, i)) {
				  let vote = table::borrow(&state.votes, i);
				  if (vote.goal_id == goal_id && vote.ideas_id == ideas_id) {
					  vector::push_back(&mut voters, vote.voter);
				  };
			  };
			  i = i + 1;
		  };
		  voters
	  }

	public fun getMsgIDs(state: &State, ideas_id: u64): vector<u64> {
		let mut ids = vector::empty<u64>();
		let mut i = 0;
		  while (i < state.message_counter) {
			  if (table::contains(&state.messages, i)) {
				  let msg = table::borrow(&state.messages, i);
				  if (msg.ideas_id == ideas_id) {
					  vector::push_back(&mut ids, i);
				  };
			  };
			  i = i + 1;
		  };
		  ids
	  }

	public fun all_messages(state: &State, id: u64): string::String {
		let msg = table::borrow(&state.messages, id);
		// Build JSON: {"sender":"...","message":"...","id":...}
		let mut json = string::utf8(b"{\"sender\":\"");
		// append sender
		string::append(&mut json, string::utf8(*string::as_bytes(&msg.sender)));
		string::append(&mut json, string::utf8(b"\",\"message\":\""));
		// append message
		string::append(&mut json, string::utf8(*string::as_bytes(&msg.message)));
		string::append(&mut json, string::utf8(b"\",\"id\":"));
		let id_str = u64_to_string(id);
		string::append(&mut json, id_str);
		string::append(&mut json, string::utf8(b"}"));
		json
	}

	public fun getReplyIDs(state: &State, message_id: u64): vector<u64> {
		let mut ids = vector::empty<u64>();
		let mut i = 0;
		while (i < state.reply_counter) {
			if (table::contains(&state.replies, i)) {
				let reply = table::borrow(&state.replies, i);
				if (reply.message_id == message_id) {
					vector::push_back(&mut ids, i);
				};
			};
			i = i + 1;
		};
		ids
	}

	public fun all_replies(state: &State, id: u64): string::String {
		let reply = table::borrow(&state.replies, id);
		// Build JSON: {"message":"...","ideas_id":...,"id":...}
		let mut json = string::utf8(b"{\"message\":\"");
		string::append(&mut json, string::utf8(*string::as_bytes(&reply.message)));
		string::append(&mut json, string::utf8(b"\",\"ideas_id\":"));
		let ideas_id_str = u64_to_string(reply.ideas_id);
		string::append(&mut json, ideas_id_str);
		string::append(&mut json, string::utf8(b",\"id\":"));
		let id_str = u64_to_string(id);
		string::append(&mut json, id_str);
		string::append(&mut json, string::utf8(b"}"));
		json
	}

	public fun message_ids(state: &State): u64 {
		state.message_counter
	}

	public fun reply_ids(state: &State): u64 {
		state.reply_counter
	}

	// Helper function to convert u64 to string
	fun u64_to_string(value: u64): string::String {
		if (value == 0) {
			return string::utf8(b"0")
		};
		let mut result = vector::empty<u8>();
		let mut temp = value;
		while (temp > 0) {
			let digit = ((temp % 10) as u8) + 48;
			vector::push_back(&mut result, digit);
			temp = temp / 10;
		};
		vector::reverse(&mut result);
		string::utf8(result)
	}

}
