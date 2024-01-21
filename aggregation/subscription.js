// Give me those list of channel that user has subscribed

const getUserSubscribedChannels=[
  {
    $match:{
     subscriber:"Jawad ID"
      }
  },
  {
    $group: {
      _id: "$subscriber",
      subscriber: { "$first": "$subscriber" },
      channels: { "$push": "$channel" }
    }
  },
  {
    $lookup: {
      from: "users",
      localField: "channels",
      foreignField: "_id",
      as: "channel",
      pipeline:[
        {
          $project:{
            _id:0,
           username:1,
           avatar:1 
          }
        }
      ]
    }
  },
  {
    $project: {
      _id:0,
      channels:0
    }
  }
  
]
