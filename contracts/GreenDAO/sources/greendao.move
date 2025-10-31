	/// Global DAO State resource
		// If global state is needed, define here. For now, use State as before.
module 0x0::dao {
	use std::string;
	use iota::table::{Self, Table};
	use iota::object;
	use iota::tx_context;

	/// DAO Structs
	public struct DaoURI has key, store {
		id: object::UID,
		dao_wallet: string::String,
		dao_uri: string::String,
		finished: bool,
		template: string::String
	}

	public struct GoalURI has key, store {
		id: object::UID,
		dao_id: u64,
		goal_uri: string::String
	}

	public struct IdeasURI has key, store {
		id: object::UID,
		goal_id: u64,
		ideas_uri: string::String,
		donation: u64
	}

	public struct Donation has key, store {
		id: object::UID,
		ideas_id: u64,
		wallet: string::String,
		donation: u64
	}

	public struct Join has key, store {
		id: object::UID,
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

	/// Storage
	public struct State has key {
		id: object::UID,
		dao_counter: u64,
		goal_counter: u64,
		ideas_counter: u64,
		join_counter: u64,
		donation_counter: u64,
		daos: Table<u64, DaoURI>,
		goals: Table<u64, GoalURI>,
		ideas: Table<u64, IdeasURI>,
		joins: Table<u64, Join>,
		donations: Table<u64, Donation>,
		user_badges: Table<string::String, UserBadge>
	}

	/// Initialization
	fun init(ctx: &mut tx_context::TxContext): () {
		let state = State {
			id: object::new(ctx),
			dao_counter: 0,
			goal_counter: 0,
			ideas_counter: 0,
			join_counter: 0,
			donation_counter: 0,
			daos: table::new(ctx),
			goals: table::new(ctx),
			ideas: table::new(ctx),
			joins: table::new(ctx),
			donations: table::new(ctx),
			user_badges: table::new(ctx)
		};
		transfer::share_object(state);
	}

	/// Create DAO
	public entry fun create_dao(
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
			id: object::new(ctx),
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
				id: object::new(ctx),
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
	state.dao_counter = id + 1;
		id
	}

	/// Create Goal
	public entry fun create_goal(
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
			id: object::new(ctx),
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
				id: object::new(ctx),
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
	state.goal_counter = id + 1;
		id
	}

	/// Create Ideas
	public entry fun create_ideas(
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
			id: object::new(ctx),
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
				id: object::new(ctx),
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
	state.ideas_counter = id + 1;
		id
	}

	/// Add Donation
	public entry fun add_donation(
		state: &mut State,
		ideas_id: u64,
		donation: u64,
		donator: vector<u8>,
		ctx: &mut tx_context::TxContext
	) {
		let id = state.donation_counter;
		let donator_str = string::utf8(donator);
		let d = Donation {
			id: object::new(ctx),
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
				id: object::new(ctx),
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
	state.donation_counter = id + 1;
	}

	/// Join Community
	public entry fun join_community(
		state: &mut State,
		dao_id: u64,
		person: vector<u8>,
		ctx: &mut tx_context::TxContext
	) {
		let id = state.join_counter;
		let person_str = string::utf8(person);
		let join = Join {
			id: object::new(ctx),
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
				id: object::new(ctx),
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
	state.join_counter = id + 1;
	}
}
