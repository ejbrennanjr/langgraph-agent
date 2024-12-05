import { z } from "zod";

export const CommentSchema = z.object({
  text: z.string().max(100000).describe("The comment text."),
  author_id: z
    .string()
    .uuid()
    .optional()
    .describe(
      "The Member ID of the Comment's author. Defaults to the user identified by the API token."
    ),
  created_at: z
    .string()
    .describe(
      "Defaults to the time/date the comment is created, but can be set to reflect another date."
    ),
  updated_at: z
    .string()
    .describe(
      "Defaults to the time/date the comment is last updated, but can be set to reflect another date."
    ),
  external_id: z
    .string()
    .max(1024)
    .nullable()
    .optional()
    .describe(
      "This field can be set to another unique ID. In the case that the comment has been imported from another tool, the ID in the other tool can be indicated here."
    ),
  parent_id: z
    .number()
    .nullable()
    .optional()
    .describe("The ID of the Comment that this comment is threaded under."),
});

// Infer the TypeScript type from the Zod schema
export type Comment = z.infer<typeof CommentSchema>;

// Define the Zod schema for the Group entity
export const GroupSchema = z.object({
  app_url: z.string().describe("The Shortcut application url for the Group."),
  description: z.string().describe("The description of the Group."),
  archived: z.boolean().describe("Whether or not the Group is archived."),
  entity_type: z.string().describe("A string description of this resource."),
  color: z
    .string()
    .regex(/^#[a-fA-F0-9]{6}$/)
    .nullable()
    .describe("The hex color to be displayed with the Group."),
  num_stories_started: z
    .number()
    .describe(
      "The number of stories assigned to the group which are in a started workflow state."
    ),
  mention_name: z
    .string()
    .regex(/^[a-z0-9\-\_\.]+$/)
    .describe("The mention name of the Group."),
  name: z.string().describe("The name of the Group."),
  global_id: z.string().describe("The global ID of the Group."),
  color_key: z
    .string()
    .nullable()
    .describe("The color key to be displayed with the Group."),
  num_stories: z
    .number()
    .describe("The total number of stories assigned to the group."),
  num_epics_started: z
    .number()
    .describe(
      "The number of epics assigned to the group which are in the started workflow state."
    ),
  num_stories_backlog: z
    .number()
    .describe(
      "The number of stories assigned to the group which are in a backlog workflow state."
    ),
  id: z.string().uuid().describe("The ID of the Group."),
  display_icon: z.any().nullable().describe("The display icon of the Group."),
  member_ids: z
    .array(z.string().uuid())
    .describe("The Member IDs contained within the Group."),
  workflow_ids: z
    .array(z.number())
    .describe("The Workflow IDs contained within the Group."),
});

// Infer the TypeScript type from the Zod schema
export type Group = z.infer<typeof GroupSchema>;

// Define the Zod schema for the Story definition
export const StorySchema = z.object({
  app_url: z.string().describe("The Shortcut application URL for the Story."),
  description: z.string().describe("The description of the story."),
  archived: z.boolean().describe("True if the story has been archived or not."),
  started: z
    .boolean()
    .describe("A true/false boolean indicating if the Story has been started."),
  story_links: z
    .array(
      z.object({
        entity_type: z
          .string()
          .describe("A string description of this resource."),
        id: z.number().describe("The unique identifier of the Story Link."),
        subject_id: z.number().describe("The ID of the subject Story."),
        verb: z
          .string()
          .describe("How the subject Story acts on the object Story."),
        object_id: z.number().describe("The ID of the object Story."),
      })
    )
    .optional()
    .describe("An array of story links attached to the Story."),
  entity_type: z.string().describe("A string description of this resource."),
  labels: z
    .array(
      z.object({
        app_url: z
          .string()
          .describe("The Shortcut application URL for the Label."),
        description: z
          .string()
          .optional()
          .describe("The description of the Label."),
        archived: z
          .boolean()
          .describe(
            "A true/false boolean indicating if the Label has been archived."
          ),
        entity_type: z
          .string()
          .describe("A string description of this resource."),
        color: z
          .string()
          .optional()
          .describe(
            'The hex color to be displayed with the Label (for example, "#ff0000").'
          ),
        name: z.string().describe("The name of the Label."),
        global_id: z.string().describe("The Global ID of the Label."),
        updated_at: z
          .string()
          .optional()
          .describe("The time/date that the Label was updated."),
        external_id: z
          .string()
          .nullable()
          .optional()
          .describe("This field can be set to another unique ID."),
        id: z.number().describe("The unique ID of the Label."),
        created_at: z
          .string()
          .describe("The time/date that the Label was created."),
      })
    )
    .optional()
    .describe("An array of labels attached to the story."),
  story_type: z
    .enum(["feature", "chore", "bug"])
    .describe("The type of story (feature, bug, chore)."),
  name: z.string().min(1).max(512).describe("The name of the story."),
  completed_at_override: z
    .string()
    .nullable()
    .optional()
    .describe("A manual override for the time/date the Story was completed."),
  started_at: z
    .string()
    .nullable()
    .optional()
    .describe("The time/date the Story was started."),
  completed_at: z
    .string()
    .nullable()
    .optional()
    .describe("The time/date the Story was completed."),
  global_id: z.string().optional().describe("The Global ID of the Story."),
  completed: z
    .boolean()
    .describe(
      "A true/false boolean indicating if the Story has been completed."
    ),
  comments: z
    .array(
      z.object({
        app_url: z
          .string()
          .describe("The Shortcut application URL for the Comment."),
        entity_type: z
          .string()
          .describe("A string description of this resource."),
        deleted: z
          .boolean()
          .describe(
            "True/false boolean indicating whether the Comment has been deleted."
          ),
        story_id: z
          .number()
          .describe("The ID of the Story on which the Comment appears."),
        mention_ids: z
          .array(z.string().uuid())
          .optional()
          .describe("Deprecated: use member_mention_ids."),
        author_id: z
          .string()
          .uuid()
          .optional()
          .describe("The unique ID of the Member who is the Comment's author."),
        member_mention_ids: z
          .array(z.string().uuid())
          .optional()
          .describe(
            "The unique IDs of the Members who are mentioned in the Comment."
          ),
        blocker: z
          .boolean()
          .optional()
          .describe(
            "Marks the comment as a blocker that can be surfaced to permissions or teams mentioned in the comment."
          ),
        linked_to_slack: z
          .boolean()
          .describe(
            "Whether the Comment is currently the root of a thread that is linked to Slack."
          ),
        updated_at: z
          .string()
          .optional()
          .describe("The time/date when the Comment was updated."),
        group_mention_ids: z
          .array(z.string().uuid())
          .optional()
          .describe(
            "The unique IDs of the Groups who are mentioned in the Comment."
          ),
        external_id: z
          .string()
          .nullable()
          .optional()
          .describe("This field can be set to another unique ID."),
        id: z.number().describe("The unique ID of the Comment."),
        position: z
          .number()
          .describe(
            "The Comments numerical position in the list from oldest to newest."
          ),
        unblocks_parent: z
          .boolean()
          .optional()
          .describe("Marks the comment as an unblocker to its blocker parent."),
        created_at: z
          .string()
          .describe("The time/date when the Comment was created."),
        text: z.string().describe("The text of the Comment."),
      })
    )
    .optional()
    .describe("An array of comments attached to the story."),
  blocker: z
    .boolean()
    .describe(
      "A true/false boolean indicating if the Story is currently a blocker."
    ),
  branches: z
    .array(
      z.object({
        entity_type: z
          .string()
          .describe("A string description of this resource."),
        id: z.number().describe("The unique identifier of the Branch."),
        name: z.string().describe("The name of the Branch."),
        url: z.string().describe("The URL of the Branch."),
        created_at: z
          .string()
          .describe("The time/date the Branch was created."),
        updated_at: z
          .string()
          .describe("The time/date the Branch was updated."),
      })
    )
    .optional()
    .describe("An array of Git branches attached to the story."),
  epic_id: z
    .number()
    .nullable()
    .optional()
    .describe("The ID of the epic the story belongs to."),
  requested_by_id: z
    .string()
    .uuid()
    .optional()
    .describe("The ID of the Member that requested the story."),
  iteration_id: z
    .number()
    .nullable()
    .optional()
    .describe("The ID of the iteration the story belongs to."),
  tasks: z
    .array(
      z.object({
        description: z.string().describe("Full text of the Task."),
        entity_type: z
          .string()
          .describe("A string description of this resource."),
        story_id: z
          .number()
          .describe("The unique identifier of the parent Story."),
        mention_ids: z
          .array(z.string().uuid())
          .optional()
          .describe("Deprecated: use member_mention_ids."),
        member_mention_ids: z
          .array(z.string().uuid())
          .optional()
          .describe("An array of UUIDs of Members mentioned in this Task."),
        completed_at: z
          .string()
          .optional()
          .describe("The time/date the Task was completed."),
        updated_at: z
          .string()
          .optional()
          .describe("The time/date the Task was updated."),
        group_mention_ids: z
          .array(z.string().uuid())
          .optional()
          .describe("An array of UUIDs of Groups mentioned in this Task."),
        owner_ids: z
          .array(z.string().uuid())
          .optional()
          .describe("An array of UUIDs of the Owners of this Task."),
        external_id: z
          .string()
          .nullable()
          .optional()
          .describe("This field can be set to another unique ID."),
        id: z.number().describe("The unique ID of the Task."),
        position: z
          .number()
          .describe(
            "The number corresponding to the Task's position within a list of Tasks on a Story."
          ),
        complete: z
          .boolean()
          .describe(
            "True/false boolean indicating whether the Task has been completed."
          ),
        created_at: z.string().describe("The time/date the Task was created."),
      })
    )
    .optional()
    .describe("An array of tasks connected to the story."),
  label_ids: z
    .array(z.number())
    .optional()
    .describe("An array of label ids attached to the story."),
  group_id: z
    .string()
    .uuid()
    .optional()
    .nullable()
    .describe("The ID of the group associated with the story."),
  workflow_state_id: z
    .number()
    .describe("The ID of the workflow state the story is currently in."),
  updated_at: z
    .string()
    .optional()
    .describe("The time/date the Story was updated."),
  pull_requests: z
    .array(
      z.object({
        entity_type: z
          .string()
          .describe("A string description of this resource."),
        closed: z
          .boolean()
          .describe(
            "True/False boolean indicating whether the VCS pull request has been closed."
          ),
        merged: z
          .boolean()
          .describe(
            "True/False boolean indicating whether the VCS pull request has been merged."
          ),
        num_added: z
          .number()
          .describe(
            "Number of lines added in the pull request, according to VCS."
          ),
        branch_id: z
          .number()
          .describe("The ID of the branch for the particular pull request."),
        number: z
          .number()
          .describe("The pull request's unique number ID in VCS."),
        branch_name: z
          .string()
          .describe("The name of the branch for the particular pull request."),
        target_branch_name: z
          .string()
          .describe(
            "The name of the target branch for the particular pull request."
          ),
        title: z.string().describe("The title of the pull request."),
        updated_at: z
          .string()
          .describe("The time/date the pull request was created."),
        has_overlapping_stories: z
          .boolean()
          .describe(
            "Boolean indicating that the Pull Request has Stories that have Pull Requests that change at least one of the same lines this Pull Request changes."
          ),
        draft: z
          .boolean()
          .describe(
            "True/False boolean indicating whether the VCS pull request is in the draft state."
          ),
        id: z
          .number()
          .describe(
            "The unique ID associated with the pull request in Shortcut."
          ),
        url: z.string().describe("The URL for the pull request."),
        num_removed: z
          .number()
          .describe(
            "Number of lines removed in the pull request, according to VCS."
          ),
        review_status: z
          .string()
          .describe("The status of the review for the pull request."),
        num_modified: z
          .number()
          .optional()
          .describe(
            "Number of lines modified in the pull request, according to VCS."
          ),
        build_status: z
          .string()
          .describe(
            "The status of the Continuous Integration workflow for the pull request."
          ),
        target_branch_id: z
          .number()
          .describe(
            "The ID of the target branch for the particular pull request."
          ),
        repository_id: z
          .number()
          .describe(
            "The ID of the repository for the particular pull request."
          ),
        created_at: z
          .string()
          .describe("The time/date the pull request was created."),
      })
    )
    .optional()
    .describe("An array of Pull/Merge Requests attached to the story."),
  group_mention_ids: z
    .array(z.string().uuid())
    .optional()
    .describe(
      "An array of Group IDs that have been mentioned in the Story description."
    ),
  follower_ids: z
    .array(z.string().uuid())
    .optional()
    .describe("An array of UUIDs for any Members listed as Followers."),
  owner_ids: z
    .array(z.string().uuid())
    .optional()
    .describe("An array of UUIDs of the owners of this story."),
  external_id: z
    .string()
    .nullable()
    .optional()
    .describe("This field can be set to another unique ID."),
  id: z.number().describe("The unique ID of the Story."),
  lead_time: z
    .number()
    .nullable()
    .optional()
    .describe("The lead time (in seconds) of this story when complete."),
  estimate: z
    .number()
    .nullable()
    .optional()
    .describe("The numeric point estimate of the story."),
  commits: z
    .array(
      z.object({
        entity_type: z
          .string()
          .describe("A string description of this resource."),
        id: z.number().describe("The unique identifier of the Commit."),
        message: z.string().describe("The message from the Commit."),
        url: z
          .string()
          .describe("The URL from the provider of the VCS Commit."),
      })
    )
    .optional()
    .describe("An array of commits attached to the story."),
  files: z
    .array(
      z.object({
        description: z
          .string()
          .optional()
          .describe("The description of the file."),
        entity_type: z
          .string()
          .describe("A string description of this resource."),
        story_ids: z
          .array(z.number())
          .describe("The unique IDs of the Stories associated with this file."),
        mention_ids: z
          .array(z.string().uuid())
          .optional()
          .describe("Deprecated: use member_mention_ids."),
        member_mention_ids: z
          .array(z.string().uuid())
          .optional()
          .describe(
            "The unique IDs of the Members who are mentioned in the file description."
          ),
        name: z
          .string()
          .describe("The optional User-specified name of the file."),
        thumbnail_url: z
          .string()
          .optional()
          .describe(
            "The URL where the thumbnail of the file can be found in Shortcut."
          ),
        size: z.number().describe("The size of the file."),
        uploader_id: z
          .string()
          .uuid()
          .describe("The unique ID of the Member who uploaded the file."),
        content_type: z
          .string()
          .describe("Free form string corresponding to a text or image file."),
        updated_at: z
          .string()
          .optional()
          .describe("The time/date that the file was updated."),
        filename: z
          .string()
          .describe("The name assigned to the file in Shortcut upon upload."),
        group_mention_ids: z
          .array(z.string().uuid())
          .optional()
          .describe(
            "The unique IDs of the Groups who are mentioned in the file description."
          ),
        external_id: z
          .string()
          .nullable()
          .optional()
          .describe("This field can be set to another unique ID."),
        id: z.number().describe("The unique ID for the file."),
        url: z.string().optional().describe("The URL for the file."),
        created_at: z
          .string()
          .describe("The time/date that the file was created."),
      })
    )
    .optional()
    .describe("An array of files attached to the story."),
  position: z
    .number()
    .describe(
      "A number representing the position of the story in relation to every other story in the current project."
    ),
  blocked: z
    .boolean()
    .describe(
      "A true/false boolean indicating if the Story is currently blocked."
    ),
  project_id: z
    .number()
    .nullable()
    .optional()
    .describe("The ID of the project the story belongs to."),
  deadline: z
    .string()
    .nullable()
    .optional()
    .describe("The due date of the story."),
  stats: z
    .object({
      num_related_documents: z
        .number()
        .describe("The number of documents related to this Story."),
    })
    .optional()
    .describe("The stats object for Stories."),
  cycle_time: z
    .number()
    .nullable()
    .optional()
    .describe("The cycle time (in seconds) of this story when complete."),
  created_at: z.string().describe("The time/date the Story was created."),
  moved_at: z
    .string()
    .optional()
    .describe("The time/date the Story was last changed workflow-state."),
});

// Infer the TypeScript type from the Zod schema
export type Story = z.infer<typeof StorySchema>;
