	/// Global DAO State resource
		// If global state is needed, define here. For now, use State as before.
module 0x0::dao {
	
	use std::string;
	use iota::table::{Self, Table};
	use iota::object;
	use iota::tx_context;
	use iota::event;

	/// DAO Structs
	public struct DaoURI has key, store {
		id: UID,
		dao_wallet: string::String,
		dao_uri: string::String,
		finished: bool,
		template: string::String
	}

	public struct GoalURI has key, store {
		id: UID,
		dao_id: u64,
		goal_uri: string::String
	}

	public struct IdeasURI has key, store {
		id: UID,
		goal_id: u64,
		ideas_uri: string::String,
		donation: u64
	}

	public struct Donation has key, store {
		id: UID,
		ideas_id: u64,
		wallet: string::String,
		donation: u64
	}

	public struct Join has store {
		id: UID,
		dao_id: u64,
		wallet: string::String
	}

	public struct UserBadge has key, store {
		id: UID,
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
		daos: Table<u64, DaoURI>,
		goals: Table<u64, GoalURI>,
		ideas: Table<u64, IdeasURI>,
		joins: Table<u64, Join>,
		donations: Table<u64, Donation>,
		user_badges: Table<string::String, UserBadge>
	}

	/// Initialization
	fun init(ctx: &mut tx_context::TxContext): () {
		let daos = table::new(ctx);
		let goals = table::new(ctx);
		let ideas = table::new(ctx);
		let joins = table::new(ctx);
		let donations = table::new(ctx);
		let user_badges = table::new(ctx);


		let state = State {
			id: object::new(ctx),
			dao_counter: 0,
			goal_counter: 0,
			ideas_counter: 0,
			join_counter: 0,
			donation_counter: 0,
			daos: daos,
			goals: goals,
			ideas: ideas,
			joins: joins,
			donations: donations,
			user_badges: user_badges
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
			id: iota::object::new(ctx),
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
			id: iota::object::new(ctx),
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
			id: iota::object::new(ctx),
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
			id: iota::object::new(ctx),
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
	public entry fun join_community(
		state: &mut State,
		dao_id: u64,
		person: vector<u8>,
		ctx: &mut tx_context::TxContext
	) {
		let id = state.join_counter;
		let person_str = string::utf8(person);
		let join = Join {
			id: iota::object::new(ctx),
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

	/// Get DAO by id
	public entry fun get_dao(state: &State, id: u64, ctx: &mut tx_context::TxContext) {
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
	public entry fun get_goal(state: &State, id: u64, ctx: &mut tx_context::TxContext) {
		let goal = table::borrow(&state.goals, id);
		event::emit(GoalRetrieved {
			id,
			dao_id: goal.dao_id,
			goal_uri: goal.goal_uri
		});
	}

	/// Get Ideas by id
	public entry fun get_ideas(state: &State, id: u64, ctx: &mut tx_context::TxContext) {
		let ideas = table::borrow(&state.ideas, id);
		event::emit(IdeasRetrieved {
			id,
			goal_id: ideas.goal_id,
			ideas_uri: ideas.ideas_uri,
			donation: ideas.donation
		});
	}

	/// Get Donation by id
	public entry fun get_donation(state: &State, id: u64, ctx: &mut tx_context::TxContext) {
		let d = table::borrow(&state.donations, id);
		event::emit(DonationRetrieved {
			id,
			ideas_id: d.ideas_id,
			wallet: d.wallet,
			donation: d.donation
		});
	}

	/// Get Join by id
	public entry fun get_join(state: &State, id: u64, ctx: &mut tx_context::TxContext) {
		let j = table::borrow(&state.joins, id);
		event::emit(JoinRetrieved {
			id,
			dao_id: j.dao_id,
			wallet: j.wallet
		});
	}

	/// Update template for a DAO
	public entry fun update_template(
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
	public entry fun get_user_badge(state: &State, wallet: vector<u8>, ctx: &mut tx_context::TxContext) {
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
	public entry fun view_all_daos(state: &State, ctx: &mut tx_context::TxContext) {
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
	public entry fun view_goals_for_dao(state: &State, dao_id: u64, ctx: &mut tx_context::TxContext) {
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
	public entry fun view_ideas_for_goal(state: &State, goal_id: u64, ctx: &mut tx_context::TxContext) {
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
	public entry fun view_donations_for_idea(state: &State, ideas_id: u64, ctx: &mut tx_context::TxContext) {
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

	/// View joins for a DAO
	public entry fun view_joins_for_dao(state: &State, dao_id: u64, ctx: &mut tx_context::TxContext) {
		let mut joins = vector::empty<JoinRetrieved>();
		let mut i = 0;
		while (i < state.join_counter) {
			if (table::contains(&state.joins, i)) {
				let j = table::borrow(&state.joins, i);
				if (j.dao_id == dao_id) {
					vector::push_back(&mut joins, JoinRetrieved {
						id: i,
						dao_id: j.dao_id,
						wallet: j.wallet
					});
				};
			};
			i = i + 1;
		};
		event::emit(JoinsForDaoRetrieved { dao_id, joins });
	}
}
