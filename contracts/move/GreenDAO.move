module GreenDAO {
    use object;
    use tx_context;
    use transfer;
    use vector;
    /// Dao structure
    struct Dao has key {
        id: object::UID,
        dao_wallet: vector<u8>,
        dao_uri: vector<u8>,
        finished: bool,
    }
    /// Goal structure
    struct Goal has key {
        id: object::UID,
        dao_id: u64,
        goal_uri: vector<u8>,
    }
    /// Ideas structure
    struct Ideas has key {
        id: object::UID,
        goal_id: u64,
        ideas_uri: vector<u8>,
        donation: u64,
    }
    /// Donation structure
    struct Donation has key {
        id: object::UID,
        ideas_id: u64,
        wallet: vector<u8>,
        donation: u64,
    }
    /// Smart contract URI structure
    struct SmartContractURI has key {
        id: object::UID,
        smart_contract_id: u64,
        ideas_id: u64,
        smart_contract_uri: vector<u8>,
    }
    /// Goal-Ideas-Votes structure
    struct GoalIdeasVote has key {
        id: object::UID,
        goal_id: u64,
        ideas_id: u64,
        wallet: vector<u8>,
    }
    /// Message structure
    struct Message has key {
        id: object::UID,
        message_id: u64,
        ideas_id: u64,
        message: vector<u8>,
        sender: vector<u8>,
    }
    /// Message read structure
    struct MessageRead has key {
        id: object::UID,
        message_id: u64,
        ideas_id: u64,
        wallet: vector<u8>,
        msg_type: vector<u8>,
    }
    /// Reply structure
    struct Reply has key {
        id: object::UID,
        reply_id: u64,
        message_id: u64,
        ideas_id: u64,
        message: vector<u8>,
    }
    /// Join structure
    struct Join has key {
        id: object::UID,
        daoid: u64,
        wallet: vector<u8>,
    }
    /// User badge structure
    struct UserBadge has key {
        id: object::UID,
        wallet: vector<u8>,
        dao: bool,
        joined: bool,
        goal: bool,
        ideas: bool,
        vote: bool,
        donation: bool,
        comment: bool,
        reply: bool,
    }
    /// Resource to store all DAOs
    struct DaoStore has key {
        daos: vector<Dao>,
        goals: vector<Goal>,
        ideas: vector<Ideas>,
        donations: vector<Donation>,
        smart_contracts: vector<SmartContractURI>,
        votes: vector<GoalIdeasVote>,
        messages: vector<Message>,
        message_reads: vector<MessageRead>,
        replies: vector<Reply>,
        joins: vector<Join>,
        user_badges: vector<UserBadge>,
    }
    /// Initialize the store
    entry fun init(ctx: &mut tx_context::TxContext) {
        transfer::share_object(DaoStore {
            daos: vector::empty<Dao>(),
            goals: vector::empty<Goal>(),
            ideas: vector::empty<Ideas>(),
            donations: vector::empty<Donation>(),
            smart_contracts: vector::empty<SmartContractURI>(),
            votes: vector::empty<GoalIdeasVote>(),
            messages: vector::empty<Message>(),
            message_reads: vector::empty<MessageRead>(),
            replies: vector::empty<Reply>(),
            joins: vector::empty<Join>(),
            user_badges: vector::empty<UserBadge>(),
        });
    }
    /// Create DAO
    entry fun create_dao(store: &mut DaoStore, dao_wallet: vector<u8>, dao_uri: vector<u8>, ctx: &mut tx_context::TxContext) {
        let dao = Dao { id: object::new(ctx), dao_wallet, dao_uri, finished: false };
        vector::push_back(&mut store.daos, dao);
    }
    /// Create Goal
    entry fun create_goal(store: &mut DaoStore, dao_id: u64, goal_uri: vector<u8>, ctx: &mut tx_context::TxContext) {
        let goal = Goal { id: object::new(ctx), dao_id, goal_uri };
        vector::push_back(&mut store.goals, goal);
    }
    /// Create Ideas
    entry fun create_ideas(store: &mut DaoStore, goal_id: u64, ideas_uri: vector<u8>, ctx: &mut tx_context::TxContext) {
        let ideas = Ideas { id: object::new(ctx), goal_id, ideas_uri, donation: 0 };
        vector::push_back(&mut store.ideas, ideas);
    }
    /// Add Donation
    entry fun add_donation(store: &mut DaoStore, ideas_id: u64, wallet: vector<u8>, donation: u64, ctx: &mut tx_context::TxContext) {
        let d = Donation { id: object::new(ctx), ideas_id, wallet, donation };
        vector::push_back(&mut store.donations, d);
    }
    /// Join Community
    entry fun join_community(store: &mut DaoStore, daoid: u64, wallet: vector<u8>, ctx: &mut tx_context::TxContext) {
        let j = Join { id: object::new(ctx), daoid, wallet };
        vector::push_back(&mut store.joins, j);
    }
    /// Send Message
    entry fun send_message(store: &mut DaoStore, ideas_id: u64, message: vector<u8>, sender: vector<u8>, ctx: &mut tx_context::TxContext) {
        let msg = Message { id: object::new(ctx), message_id: vector::length(&store.messages) as u64, ideas_id, message, sender };
        vector::push_back(&mut store.messages, msg);
    }
    /// Send Reply
    entry fun send_reply(store: &mut DaoStore, message_id: u64, ideas_id: u64, message: vector<u8>, ctx: &mut tx_context::TxContext) {
        let reply = Reply { id: object::new(ctx), reply_id: vector::length(&store.replies) as u64, message_id, ideas_id, message };
        vector::push_back(&mut store.replies, reply);
    }
    /// Add Vote
    entry fun add_vote(store: &mut DaoStore, goal_id: u64, ideas_id: u64, wallet: vector<u8>, ctx: &mut tx_context::TxContext) {
        let vote = GoalIdeasVote { id: object::new(ctx), goal_id, ideas_id, wallet };
        vector::push_back(&mut store.votes, vote);
    }
    /// Add Smart Contract URI
    entry fun add_smart_contract(store: &mut DaoStore, smart_contract_id: u64, ideas_id: u64, smart_contract_uri: vector<u8>, ctx: &mut tx_context::TxContext) {
        let sc = SmartContractURI { id: object::new(ctx), smart_contract_id, ideas_id, smart_contract_uri };
        vector::push_back(&mut store.smart_contracts, sc);
    }
    /// Add User Badge
    entry fun add_user_badge(store: &mut DaoStore, wallet: vector<u8>, dao: bool, joined: bool, goal: bool, ideas: bool, vote: bool, donation: bool, comment: bool, reply: bool, ctx: &mut tx_context::TxContext) {
        let badge = UserBadge { id: object::new(ctx), wallet, dao, joined, goal, ideas, vote, donation, comment, reply };
        vector::push_back(&mut store.user_badges, badge);
    }
}
