import Activity from "../models/activity.model.js";

const createActivity = async ({
    workspace,
    project,
    user,
    action,
    target,
    targetId,
    metadata = {},
}) => {
    const activity = await Activity.create({
        workspace,
        project,
        user,
        action,
        target,
        targetId,
        metadata,
    });
    session ? { session } : undefined
    return activity[0];
};

export default createActivity;